import { Platform } from "react-native";
import AndroidTabs from "@/components/ui/custom/androidTabs";
import IOSNativeTabs from "@/components/ui/custom/iosNativeTabs";

export default function TabLayout() {
  return Platform.OS === "ios" ? <IOSNativeTabs /> : <AndroidTabs />;
}
