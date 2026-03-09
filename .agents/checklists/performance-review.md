# performance-review.md

- idle 時 CPU が不自然に上がっていないか
- 実行時 CPU が不必要に跳ねていないか
- 常駐時メモリが過剰でないか
- 不要な再レンダリングが発生していないか
- 毎フレーム更新前提の処理がないか
- 重い依存や plugin が増えていないか
- 起動時に不要な初期化が走っていないか
- interval / timeout / listener の解除漏れがないか
