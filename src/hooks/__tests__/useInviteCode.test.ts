import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

vi.mock("@/integrations/supabase/client", async () => {
  const { createSupabaseMock } = await import("@/test/supabaseMock");
  return { supabase: createSupabaseMock() };
});

import { supabase } from "@/integrations/supabase/client";
import {
  redeemInviteCode,
  createInviteCode,
  getExistingInviteCode,
} from "@/hooks/useInviteCode";
import type { SupabaseMock } from "@/test/supabaseMock";

const mock = supabase as unknown as SupabaseMock;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

beforeEach(() => {
  mock.__reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("redeemInviteCode", () => {
  /** Queue the three queries a successful redemption makes. */
  const queueHappyPath = (teacherName: string | null = "Ms. Rivera") => {
    mock.__queue("invite_codes", [
      { data: { teacher_id: "teacher-1" }, error: null },
    ]);
    mock.__queue("profiles", [
      { data: null, error: null }, // the update
      { data: { full_name: teacherName }, error: null }, // the name lookup
    ]);
  };

  it("attaches the student to the teacher who owns the code", async () => {
    queueHappyPath();

    await redeemInviteCode("ABC234", "student-1");

    expect(mock.__lastPayload("profiles", "update")).toEqual({
      teacher_id: "teacher-1",
    });
    const eqCalls = mock.__callsFor("profiles", "eq");
    expect(eqCalls).toContainEqual(
      expect.objectContaining({ args: ["id", "student-1"] }),
    );
  });

  it("returns the teacher's name so the UI can confirm who they joined", async () => {
    queueHappyPath("Ms. Rivera");

    const result = await redeemInviteCode("ABC234", "student-1");

    expect(result).toEqual({ teacherName: "Ms. Rivera" });
  });

  it("returns a null name rather than throwing when the teacher has no full_name", async () => {
    queueHappyPath(null);

    const result = await redeemInviteCode("ABC234", "student-1");

    expect(result).toEqual({ teacherName: null });
  });

  // Students retype these from a screenshot or a text message.
  it("uppercases and trims what the student typed", async () => {
    queueHappyPath();

    await redeemInviteCode("  abc234  ", "student-1");

    const lookup = mock.__callsFor("invite_codes", "eq")[0];
    expect(lookup.args).toEqual(["code", "ABC234"]);
  });

  it("rejects a code that does not exist", async () => {
    mock.__queue("invite_codes", [
      { data: null, error: new Error("no rows") },
    ]);

    await expect(redeemInviteCode("NOPE12", "student-1")).rejects.toThrow(
      "Invalid code",
    );
  });

  it("rejects when the lookup returns no row and no error", async () => {
    mock.__queue("invite_codes", [{ data: null, error: null }]);

    await expect(redeemInviteCode("NOPE12", "student-1")).rejects.toThrow(
      "Invalid code",
    );
  });

  it("does not attach the student when the code is invalid", async () => {
    mock.__queue("invite_codes", [
      { data: null, error: new Error("no rows") },
    ]);

    await expect(
      redeemInviteCode("NOPE12", "student-1"),
    ).rejects.toThrow();
    expect(mock.__callsFor("profiles", "update")).toHaveLength(0);
  });

  it("surfaces a failure to write the teacher link", async () => {
    mock.__queue("invite_codes", [
      { data: { teacher_id: "teacher-1" }, error: null },
    ]);
    mock.__queue("profiles", [
      { data: null, error: new Error("row level security") },
    ]);

    await expect(redeemInviteCode("ABC234", "student-1")).rejects.toThrow(
      "row level security",
    );
  });

  // Two duplicate rows make .single() error, which this reports as "Invalid
  // code" — see the collision note in createInviteCode below.
  it("reports duplicate codes as invalid", async () => {
    mock.__queue("invite_codes", [
      {
        data: null,
        error: new Error("multiple (or no) rows returned"),
      },
    ]);

    await expect(redeemInviteCode("ABC234", "student-1")).rejects.toThrow(
      "Invalid code",
    );
  });
});

describe("createInviteCode", () => {
  it("returns a six character code", async () => {
    const code = await createInviteCode("teacher-1");

    expect(code).toHaveLength(6);
  });

  // I/O/0/1 are left out of the alphabet so codes survive being read aloud
  // or copied off a screenshot.
  it("never emits visually ambiguous characters", async () => {
    const codes = await Promise.all(
      Array.from({ length: 200 }, () => createInviteCode("teacher-1")),
    );

    for (const code of codes) {
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
      expect(code).not.toMatch(/[IO01]/);
    }
  });

  it("draws from the full alphabet", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(await createInviteCode("teacher-1")).toBe("AAAAAA");

    vi.spyOn(Math, "random").mockReturnValue(0.9999);
    expect(await createInviteCode("teacher-1")).toBe(
      CODE_ALPHABET[31].repeat(6),
    );
  });

  it("stores the code against the teacher", async () => {
    const code = await createInviteCode("teacher-1");

    expect(mock.__lastPayload("invite_codes", "insert")).toEqual({
      code,
      teacher_id: "teacher-1",
    });
  });

  // generateCode picks at random with no uniqueness check and no retry, so a
  // collision surfaces as a raw insert failure. If the column has no unique
  // constraint it is worse: the duplicate is accepted and redemption then
  // fails for everyone holding that code.
  it("propagates an insert failure rather than retrying", async () => {
    mock.__setTable("invite_codes", {
      data: null,
      error: new Error("duplicate key value violates unique constraint"),
    });

    await expect(createInviteCode("teacher-1")).rejects.toThrow(
      "duplicate key",
    );
  });
});

describe("getExistingInviteCode", () => {
  it("returns the teacher's most recent code", async () => {
    mock.__setTable("invite_codes", {
      data: [{ code: "NEWER1" }, { code: "OLDER2" }],
      error: null,
    });

    expect(await getExistingInviteCode("teacher-1")).toBe("NEWER1");
  });

  it("asks the database for the newest row first", async () => {
    mock.__setTable("invite_codes", { data: [{ code: "ABC234" }], error: null });

    await getExistingInviteCode("teacher-1");

    expect(mock.__callsFor("invite_codes", "order")[0].args).toEqual([
      "created_at",
      { ascending: false },
    ]);
  });

  it("scopes the lookup to the teacher", async () => {
    mock.__setTable("invite_codes", { data: [{ code: "ABC234" }], error: null });

    await getExistingInviteCode("teacher-1");

    expect(mock.__callsFor("invite_codes", "eq")[0].args).toEqual([
      "teacher_id",
      "teacher-1",
    ]);
  });

  it("returns null when the teacher has no code yet", async () => {
    mock.__setTable("invite_codes", { data: [], error: null });

    expect(await getExistingInviteCode("teacher-1")).toBeNull();
  });

  it("returns null when the query comes back empty", async () => {
    mock.__setTable("invite_codes", { data: null, error: null });

    expect(await getExistingInviteCode("teacher-1")).toBeNull();
  });
});
