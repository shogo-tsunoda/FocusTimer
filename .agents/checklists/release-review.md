# release-review.md

- 型チェック、lint、clippy、build を通したか
- `.design/design.pen` との差分が説明可能か
- Windows / macOS の主要フローを確認したか
- start / pause / resume / reset / skip を確認したか
- Focus / Break / Long Break 遷移を確認したか
- 設定保存と再起動後復元を確認したか
- idle 時 CPU と常駐メモリを確認したか
- リリースを止めるべき既知不具合が残っていないか
