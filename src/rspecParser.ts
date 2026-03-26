export interface RawTest {
  name: string;
  line: number;
  indent: number;
  type: "group" | "test";
}

export function parseRSpec(text: string): RawTest[] {
  const tests: RawTest[] = [];
  const lines = text.split("\n");
  // Supports:
  // - RSpec.describe / describe
  // - context / it / specify
  // - do ... end / { ... }
  const pattern =
    /^(\s*)(?:RSpec\.)?(describe|context|it|specify)\s+(.+?)\s*(?:do\b|\{)/g;

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
      const name =
        (raw.startsWith("'") && raw.endsWith("'")) ||
        (raw.startsWith('"') && raw.endsWith('"'))
          ? raw.slice(1, -1)
          : raw;
      if (!name) continue;
      const type =
        match[2] === "it" || match[2] === "specify" ? "test" : "group";
      tests.push({ name, line: i, indent, type });
    }
  });
  return tests;
}
