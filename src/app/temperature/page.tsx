import { redirect } from "next/navigation";

// 「組織の温度」はホーム（/）に統合されました。旧URLは新ホームへリダイレクトします。
export default function TemperatureRedirect() {
    redirect("/");
}
