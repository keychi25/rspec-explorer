import * as vscode from "vscode";
import { spawn } from "child_process";

export class RSpecRunner {
  constructor(private readonly controller: vscode.TestController) {}

  /**
   * テスト実行のメインハンドラー
   */
  async runHandler(
    request: vscode.TestRunRequest,
    token: vscode.CancellationToken,
  ) {
    const run = this.controller.createTestRun(request);
    const queue: vscode.TestItem[] = [];

    // 実行対象のテストを特定（指定がなければ全テスト）
    if (request.include) {
      request.include.forEach((test) => queue.push(test));
    } else {
      this.controller.items.forEach((test) => queue.push(test));
    }

    for (const test of queue) {
      // ユーザーが停止ボタンを押したか確認
      if (token.isCancellationRequested) {
        run.skipped(test);
        continue;
      }

      run.started(test);
      const startTime = Date.now();

      try {
        await this.executeTest(test, run, token);
        void (Date.now() - startTime);
        // ここでは暫定的にpassedにしていますが、本来は終了コードで判定
      } catch (err) {
        run.errored(test, new vscode.TestMessage(String(err)));
      }
    }

    run.end();
  }

  /**
   * 実際にシェルコマンドを叩く部分
   */
  private async executeTest(
    test: vscode.TestItem,
    run: vscode.TestRun,
    token: vscode.CancellationToken,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const uri = test.uri;
      if (!uri) return resolve();

      // VS Code(0始まり) -> RSpec(1始まり) への変換
      const lineArg = test.range ? `:${test.range.start.line + 1}` : "";
      const cwd = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath;

      // コマンドの組み立て
      // 💡 実際には設定画面から "bundle exec" 等を可変にできるようにするのが理想
      const command = `bundle exec rspec ${uri.fsPath}${lineArg}`;

      run.appendOutput(`\r\n> Running: ${command}\r\n`);

      const process = spawn("sh", ["-c", command], { cwd });

      // プロセスの出力をテスト結果パネルに流す
      process.stdout.on("data", (data: Buffer | string) =>
        run.appendOutput(data.toString().replace(/\n/g, "\r\n")),
      );
      process.stderr.on("data", (data: Buffer | string) =>
        run.appendOutput(data.toString().replace(/\n/g, "\r\n")),
      );

      // 実行キャンセルへの対応
      token.onCancellationRequested(() => {
        process.kill();
        run.appendOutput("\r\n[Cancelled]\r\n");
        resolve();
      });

      process.on("close", (code: number | null) => {
        if (code === 0) {
          run.passed(test, Date.now());
        } else {
          // 失敗時はメッセージを添える
          const message = new vscode.TestMessage(
            `RSpec exited with code ${code}`,
          );
          run.failed(test, message);
        }
        resolve();
      });

      process.on("error", (err: Error) => {
        reject(err);
      });
    });
  }
}
