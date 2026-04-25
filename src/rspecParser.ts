export interface RawTest {
  name: string;
  line: number;
  indent: number;
  type: "group" | "test";
}

function normalizeFirstArgument(raw: string): string | null {
  let candidate = raw.trim();
  if (!candidate) return null;

  if (candidate.startsWith("(") && candidate.endsWith(")")) {
    candidate = candidate.slice(1, -1).trim();
  }

  const firstArg = candidate.split(",")[0]?.trim();
  if (!firstArg) return null;

  if (
    (firstArg.startsWith("'") && firstArg.endsWith("'")) ||
    (firstArg.startsWith('"') && firstArg.endsWith('"'))
  ) {
    return firstArg.slice(1, -1);
  }

  return firstArg;
}

export function parseRSpec(text: string): RawTest[] {
  const tests: RawTest[] = [];
  const lines = text.split("\n");
  // Supports:
  // - RSpec.describe / describe (focused/pending variants)
  // - context / it / specify / example / scenario
  // - do ... end / { ... }
  const pattern =
    /^(\s*)(?:RSpec\.)?(describe|fdescribe|xdescribe|context|fcontext|xcontext|feature|it|fit|xit|specify|fspecify|xspecify|example|fexample|xexample|scenario)\s*(.+?)\s*(?:do\b|\{)/g;

  lines.forEach((line, i) => {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(line)) !== null) {
      const indent = match[1]?.length ?? 0;
      const raw = match[3]?.trim();
      if (!raw) continue;
      // Normalize the first argument for display.
      // - Strings: 'foo' or "foo" -> foo
      // - Symbols/const/etc: keep as-is (e.g. Calculator, :fast, '#add')
      const name = normalizeFirstArgument(raw);
      if (!name) continue;
      const keyword = match[2];
      const type =
        keyword === "it" ||
        keyword === "fit" ||
        keyword === "xit" ||
        keyword === "specify" ||
        keyword === "fspecify" ||
        keyword === "xspecify" ||
        keyword === "example" ||
        keyword === "fexample" ||
        keyword === "xexample" ||
        keyword === "scenario"
          ? "test"
          : "group";
      tests.push({ name, line: i, indent, type });
    }
  });
  return tests;
}
