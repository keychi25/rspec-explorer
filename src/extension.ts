import * as vscode from "vscode";
import { parseRSpec } from "./rspecParser";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

class RSpecCodeLensProvider implements vscode.CodeLensProvider {
  private readonly _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  refresh() {
    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    if (document.uri.scheme !== "file") return [];
    if (!document.uri.path.endsWith("_spec.rb")) return [];

    const tests = parseRSpec(document.getText());
    return tests.map((t) => {
      const range = new vscode.Range(t.line, 0, t.line, 0);
      return new vscode.CodeLens(range, {
        title: "$(play) Run",
        command: "rspecExplorer.runAtLine",
        arguments: [document.uri, t.line],
      });
    });
  }
}

function findBundlerCwd(
  filePath: string,
  workspaceRoot?: string,
): string | undefined {
  let dir = path.dirname(filePath);
  const stopDir = workspaceRoot ? path.resolve(workspaceRoot) : undefined;

  // Walk up to find Gemfile
  while (true) {
    const gemfile = path.join(dir, "Gemfile");
    if (fs.existsSync(gemfile)) return dir;

    const parent = path.dirname(dir);
    if (parent === dir) break; // filesystem root
    if (stopDir && path.resolve(dir) === stopDir) break;
    dir = parent;
  }

  return workspaceRoot;
}

export function activate(context: vscode.ExtensionContext) {
  // Make activation failures visible in Cursor/VS Code.
  console.log("[RSpec Explorer] activate() entered");
  const output = vscode.window.createOutputChannel("RSpec Explorer");
  context.subscriptions.push(output);
  output.show(true);
  output.appendLine("[activate] activate() entered");

  try {
    const ext = vscode.extensions.getExtension("local.rspec-explorer");
    const ver = (ext?.packageJSON?.version as string | undefined) ?? "unknown";
    const name =
      (ext?.packageJSON?.name as string | undefined) ?? "rspec-explorer";
    const buildTag = `${name}@${ver}`;
    output.appendLine(`[activate] build=${buildTag}`);
    console.log(`[RSpec Explorer] build=${buildTag}`);

    const lensProvider = new RSpecCodeLensProvider();
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(
        { language: "ruby", pattern: "**/*_spec.rb" },
        lensProvider,
      ),
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        "rspecExplorer.runAtLine",
        async (uri: vscode.Uri, line: number) => {
          const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
          const cwd = findBundlerCwd(uri.fsPath, workspaceFolder?.uri.fsPath);
          if (!cwd) {
            void vscode.window.showErrorMessage(
              "No workspace folder found for this test",
            );
            return;
          }

          output.show(true);
          const cmd = `bundle exec rspec ${uri.fsPath}:${line + 1}`;
          // Make it clickable (file:line:col) in Output
          output.appendLine(`${uri.fsPath}:${line + 1}:1`);
          output.appendLine(`\n> ${cmd}`);
          const proc = spawn("sh", ["-c", cmd], { cwd });
          proc.stdout.on("data", (d) => output.append(d.toString()));
          proc.stderr.on("data", (d) => output.append(d.toString()));
          proc.on("close", (code) => {
            output.appendLine(`\n[done] exit=${code}`);
            setLineResult(uri, line, code === 0 ? "pass" : "fail");
            const ed = vscode.window.activeTextEditor;
            if (ed && ed.document.uri.toString() === uri.toString()) {
              applyResultDecorations(ed);
            }
          });
        },
      ),
    );

    // Some environments may not expose the Testing API.
    if (!("tests" in vscode) || !vscode.tests) {
      const msg =
        "vscode.tests API is not available in this editor build. Cannot register Test Explorer items.";
      output.appendLine(`[activate] error: ${msg}`);
      console.error(`[RSpec Explorer] ${msg}`);
      void vscode.window.showErrorMessage(msg);
      return;
    }

    const ctrl = vscode.tests.createTestController("rspecController", "RSpec");
    context.subscriptions.push(ctrl);

    // Map: `${uri.toString()}#${line}` -> TestItem
    const itemByLocation = new Map<string, vscode.TestItem>();

    const runGroupIcon = vscode.Uri.joinPath(
      context.extensionUri,
      "media",
      "run-group.svg",
    );
    const runTestIcon = vscode.Uri.joinPath(
      context.extensionUri,
      "media",
      "run-test.svg",
    );
    const passIcon = vscode.Uri.joinPath(
      context.extensionUri,
      "media",
      "pass.svg",
    );
    const failIcon = vscode.Uri.joinPath(
      context.extensionUri,
      "media",
      "fail.svg",
    );
    const groupDeco = vscode.window.createTextEditorDecorationType({
      gutterIconPath: runGroupIcon,
      gutterIconSize: "contain",
    });
    const testDeco = vscode.window.createTextEditorDecorationType({
      gutterIconPath: runTestIcon,
      gutterIconSize: "contain",
    });
    const passDeco = vscode.window.createTextEditorDecorationType({
      gutterIconPath: passIcon,
      gutterIconSize: "contain",
    });
    const failDeco = vscode.window.createTextEditorDecorationType({
      gutterIconPath: failIcon,
      gutterIconSize: "contain",
    });
    context.subscriptions.push(groupDeco, testDeco, passDeco, failDeco);

    // Per-file line results: uri -> (line -> pass/fail)
    const lineResults = new Map<string, Map<number, "pass" | "fail">>();
    const setLineResult = (
      uri: vscode.Uri,
      line: number,
      r: "pass" | "fail",
    ) => {
      const key = uri.toString();
      const m = lineResults.get(key) ?? new Map<number, "pass" | "fail">();
      m.set(line, r);
      lineResults.set(key, m);
    };
    const applyResultDecorations = (ed: vscode.TextEditor) => {
      if (ed.document.uri.scheme !== "file") return;
      const m = lineResults.get(ed.document.uri.toString());
      if (!m) {
        ed.setDecorations(passDeco, []);
        ed.setDecorations(failDeco, []);
        return;
      }
      const passRanges: vscode.DecorationOptions[] = [];
      const failRanges: vscode.DecorationOptions[] = [];
      for (const [line, r] of m.entries()) {
        const opt = { range: new vscode.Range(line, 0, line, 0) };
        (r === "pass" ? passRanges : failRanges).push(opt);
      }
      ed.setDecorations(passDeco, passRanges);
      ed.setDecorations(failDeco, failRanges);
    };

    output.appendLine("[activate] RSpec Explorer activated");
    console.log("[RSpec Explorer] activated");
    void vscode.window.showInformationMessage("RSpec Explorer activated");
    output.appendLine(
      `[activate] workspaceFolders=${(vscode.workspace.workspaceFolders ?? [])
        .map((f) => f.uri.fsPath)
        .join(", ")}`,
    );

    // テストデータの更新処理
    const updateTests = (doc: vscode.TextDocument) => {
      if (doc.uri.scheme !== "file") return;
      if (!doc.uri.path.endsWith("_spec.rb")) return;

      const id = doc.uri.toString();
      const existing = ctrl.items.get(id);
      const fileItem =
        existing ?? ctrl.createTestItem(id, doc.fileName, doc.uri);
      if (!existing) ctrl.items.add(fileItem);

      const tests = parseRSpec(doc.getText());
      output.appendLine(`[scan] ${doc.uri.fsPath} -> ${tests.length} item(s)`);
      console.log(
        `[RSpec Explorer] scan ${doc.uri.fsPath} -> ${tests.length} item(s)`,
      );
      // Build a nested tree based on indentation level (common RSpec style).
      const stack: { indent: number; item: vscode.TestItem }[] = [];
      const created: vscode.TestItem[] = [];
      const topLevel: vscode.TestItem[] = [];

      for (const t of tests) {
        while (stack.length > 0 && stack[stack.length - 1]!.indent >= t.indent) {
          stack.pop();
        }

        const parent =
          stack.length > 0 ? stack[stack.length - 1]!.item : fileItem;
        const item = ctrl.createTestItem(`${doc.uri}/${t.line}`, t.name, doc.uri);
        item.range = new vscode.Range(t.line, 0, t.line, 0);
        parent.children.add(item);
        created.push(item);
        if (parent === fileItem) topLevel.push(item);
        itemByLocation.set(`${doc.uri.toString()}#${t.line}`, item);

        if (t.type === "group") {
          stack.push({ indent: t.indent, item });
        }
      }

      fileItem.children.replace(topLevel);

      // Gutter markers (best-effort): show icon on each test/group line
      const active = vscode.window.activeTextEditor;
      if (active && active.document.uri.toString() === doc.uri.toString()) {
        active.setDecorations(
          groupDeco,
          tests
            .filter((t) => t.type === "group")
            .map((t) => ({ range: new vscode.Range(t.line, 0, t.line, 0) })),
        );
        active.setDecorations(
          testDeco,
          tests
            .filter((t) => t.type === "test")
            .map((t) => ({ range: new vscode.Range(t.line, 0, t.line, 0) })),
        );
        applyResultDecorations(active);
      }

      lensProvider.refresh();
    };

    // 起動時点ですでに開かれているドキュメントも拾う
    vscode.workspace.textDocuments.forEach(updateTests);

    // specファイルの変更を追従
    const watcher = vscode.workspace.createFileSystemWatcher("**/*_spec.rb");
    context.subscriptions.push(
      watcher,
      watcher.onDidCreate(async (uri) =>
        updateTests(await vscode.workspace.openTextDocument(uri)),
      ),
      watcher.onDidChange(async (uri) =>
        updateTests(await vscode.workspace.openTextDocument(uri)),
      ),
    );

    // 起動後にワークスペース全体も一度スキャンする（表示されない問題の回避）
    void (async () => {
      try {
        const folders = vscode.workspace.workspaceFolders ?? [];
        output.appendLine(
          `[discover] workspaceFolders=${folders.map((f) => f.uri.fsPath).join(", ") || "(none)"}`,
        );

        if (folders.length === 0) {
          // When the user opened a single file (no folder workspace), findFiles returns nothing.
          // Fall back to scanning already-open documents.
          const docs = vscode.workspace.textDocuments.filter(
            (d) => d.uri.scheme === "file" && d.uri.path.endsWith("_spec.rb"),
          );
          output.appendLine(
            `[discover] no workspace folder; scanning open spec docs: ${docs.length}`,
          );
          docs.forEach(updateTests);
        } else {
          const specs = await vscode.workspace.findFiles(
            "**/*_spec.rb",
            "**/{node_modules,vendor}/**",
          );
          output.appendLine(`[discover] found ${specs.length} spec file(s)`);
          console.log(
            `[RSpec Explorer] discover found ${specs.length} spec file(s)`,
          );
          for (const uri of specs) {
            const doc = await vscode.workspace.openTextDocument(uri);
            updateTests(doc);
          }
        }
      } catch (e) {
        output.appendLine(`[discover] error: ${String(e)}`);
        console.log(`[RSpec Explorer] discover error: ${String(e)}`);
      }
    })();

    // 実行プロファイル（▶︎ボタンが押された時の動作）
    ctrl.createRunProfile(
      "Run",
      vscode.TestRunProfileKind.Run,
      async (request, token) => {
        const run = ctrl.createTestRun(request);
        // If nothing is selected, run everything currently discovered.
        const discoveredRootItems: vscode.TestItem[] = [];
        ctrl.items.forEach((item) => discoveredRootItems.push(item));
        const targets: readonly vscode.TestItem[] =
          request.include && request.include.length > 0
            ? request.include
            : discoveredRootItems;
        const primary: vscode.TestItem | undefined = targets[0];
        if (!primary) {
          run.end();
          return;
        }

        // RSpec can run:
        // - entire file: `rspec path/to/spec.rb`
        // - nearest group/example at line: `rspec path/to/spec.rb:LINE`
        const primaryUri = primary.uri;
        if (!primaryUri) {
          run.errored(primary, new vscode.TestMessage("Test URI is missing"));
          run.end();
          return;
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(primaryUri);
        const cwd = findBundlerCwd(primaryUri.fsPath, workspaceFolder?.uri.fsPath);
        if (!cwd) {
          run.errored(
            primary,
            new vscode.TestMessage("No workspace folder found for this test"),
          );
          run.end();
          return;
        }

        // Mark selected targets started (best effort). Actual per-example status will be set from JSON.
        for (const t of targets) run.started(t);
        const startedAt = Date.now();
        const lineSuffix =
          primary.range && primary.range.start
            ? `:${primary.range.start.line + 1}`
            : "";

        // Write JSON formatter output to a temp file, then parse it for per-example results.
        const jsonOut = path.join(
          fs.mkdtempSync(path.join(os.tmpdir(), "rspec-explorer-")),
          "rspec.json",
        );

        const cmd = `bundle exec rspec ${primaryUri.fsPath}${lineSuffix} --format progress --format json --out ${jsonOut}`;
        // Rich, test-associated output (Cursor/VS Code shows it under the test case).
        run.appendOutput(
          primary.range
            ? `${primaryUri.fsPath}:${primary.range.start.line + 1}:1\r\n`
            : `${primaryUri.fsPath}:1:1\r\n`,
          undefined,
          primary,
        );
        run.appendOutput(`\r\n> ${cmd}\r\n`, undefined, primary);
        output.appendLine(`[run] ${cmd}`);
        let stdout = "";
        let stderr = "";

        const proc = spawn("sh", ["-c", cmd], {
          cwd,
        });

        proc.stdout.on("data", (d: Buffer | string) => {
          const s = d.toString();
          stdout += s;
          if (stdout.length > 20_000) stdout = stdout.slice(-20_000);
          run.appendOutput(s.replace(/\n/g, "\r\n"), undefined, primary);
        });
        proc.stderr.on("data", (d: Buffer | string) => {
          const s = d.toString();
          stderr += s;
          // keep memory bounded
          if (stderr.length > 20_000) stderr = stderr.slice(-20_000);
          run.appendOutput(s.replace(/\n/g, "\r\n"), undefined, primary);
        });

        token.onCancellationRequested(() => {
          proc.kill();
          run.appendOutput("\r\n[Cancelled]\r\n", undefined, primary);
          for (const t of targets) run.skipped(t);
          run.end();
        });

        proc.on("error", (e: Error) => {
          run.appendOutput(`\r\n[error] ${String(e)}\r\n`, undefined, primary);
          for (const t of targets) run.errored(t, new vscode.TestMessage(String(e)));
          run.end();
        });

        proc.on("close", (code: number | null) => {
          const elapsedMs = Date.now() - startedAt;
          run.appendOutput(`\r\n[done] exit=${code}\r\n`, undefined, primary);
          run.appendOutput(`[time] ${elapsedMs}ms\r\n`, undefined, primary);

          // Apply per-example results by parsing RSpec JSON output.
          type RSpecJsonExample = {
            id?: string;
            full_description?: string;
            status?: "passed" | "failed" | "pending";
            file_path?: string;
            line_number?: number;
            exception?: { message?: string; backtrace?: string[] };
          };
          type RSpecJson = { examples?: RSpecJsonExample[] };

          let json: RSpecJson | undefined;
          try {
            const raw = fs.readFileSync(jsonOut, "utf8");
            json = JSON.parse(raw) as RSpecJson;
          } catch (e) {
            run.appendOutput(
              `\r\n[warn] failed to parse JSON formatter output: ${String(e)}\r\n`,
              undefined,
              primary,
            );
          }

          const examples = json?.examples ?? [];
          if (examples.length === 0) {
            // Fallback: mark primary only.
            if (code === 0) run.passed(primary, elapsedMs);
            else run.failed(primary, new vscode.TestMessage("RSpec failed"), elapsedMs);
            run.end();
            return;
          }

          // Update each example TestItem status by (uri, line).
          const touched = new Set<vscode.TestItem>();
          for (const ex of examples) {
            const filePath = ex.file_path;
            const lineNumber = ex.line_number;
            if (!filePath || typeof lineNumber !== "number") continue;

            // RSpec JSON may return relative paths (e.g. "./spec/foo_spec.rb").
            // Normalize to an absolute file URI under the Bundler cwd.
            const absPath = path.isAbsolute(filePath)
              ? filePath
              : path.resolve(cwd, filePath);
            const uri = vscode.Uri.file(absPath);
            const line = Math.max(0, lineNumber - 1);
            const item = itemByLocation.get(`${uri.toString()}#${line}`);
            if (!item) continue;
            touched.add(item);

            if (ex.status === "passed") {
              run.passed(item, elapsedMs);
              setLineResult(uri, line, "pass");
              continue;
            }

            if (ex.status === "failed") {
              const detail = [
                `RSpec Explorer: ${buildTag}`,
                `Time: ${elapsedMs}ms`,
                ex.full_description ? `Example: ${ex.full_description}` : "",
                `Location: ${filePath}:${lineNumber}`,
                ex.exception?.message ? `\n--- exception ---\n${ex.exception.message}` : "",
                ex.exception?.backtrace?.length
                  ? `\n--- backtrace (head) ---\n${ex.exception.backtrace.slice(0, 12).join("\n")}`
                  : "",
              ]
                .filter(Boolean)
                .join("\n");
              const msg = new vscode.TestMessage(detail);
              msg.location = new vscode.Location(uri, new vscode.Position(line, 0));
              run.failed(item, msg, elapsedMs);
              setLineResult(uri, line, "fail");
              continue;
            }

            // pending / unknown
            run.skipped(item);
          }

          // Aggregate status up to parents so groups/files reflect children.
          const parents = new Set<vscode.TestItem>();
          for (const item of touched) {
            let p = item.parent;
            while (p) {
              parents.add(p);
              p = p.parent;
            }
          }
          for (const p of parents) {
            let hasFail = false;
            let hasPass = false;
            let hasAny = false;
            p.children.forEach((c) => {
              // We can only reliably aggregate based on what we touched this run.
              if (!touched.has(c)) return;
              hasAny = true;
              // Heuristic: if a child line result is fail, mark parent fail.
              // (We don't have direct API to read run state back.)
              const cu = c.uri;
              const cr = c.range;
              if (cu && cr) {
                const res = lineResults
                  .get(cu.toString())
                  ?.get(cr.start.line);
                if (res === "fail") hasFail = true;
                if (res === "pass") hasPass = true;
              }
            });
            if (!hasAny) continue;
            if (hasFail) run.failed(p, new vscode.TestMessage("Some child tests failed"), elapsedMs);
            else if (hasPass) run.passed(p, elapsedMs);
          }

          // Refresh gutter decorations for the active editor if it matches.
          const ed = vscode.window.activeTextEditor;
          if (ed && ed.document.uri.scheme === "file") {
            applyResultDecorations(ed);
          }
          run.end();
        });
      },
    );

    // ファイルを開いた時と保存した時にスキャン
    context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument(updateTests),
      vscode.workspace.onDidSaveTextDocument(updateTests),
    );

    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((ed) => {
        if (!ed) return;
        updateTests(ed.document);
        applyResultDecorations(ed);
      }),
    );
  } catch (e) {
    output.appendLine(`[activate] exception: ${String(e)}`);
    console.error("[RSpec Explorer] activation failed", e);
    void vscode.window.showErrorMessage(
      `RSpec Explorer activation failed: ${String(e)}`,
    );
  }
}
