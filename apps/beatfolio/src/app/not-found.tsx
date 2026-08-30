import { routes } from "../utils/config/routes";
import { FailureScreen } from "./shared/FailureScreen";

export default function NotFound() {
  return (
    <FailureScreen
      title="お探しのページは見つかりませんでした"
      message="URL が変更されたか、公開が取り下げられた可能性があります。"
      links={[
        { href: routes.players, label: "プレイヤー一覧へ" },
        { href: routes.home, label: "トップへ戻る" },
      ]}
    />
  );
}
