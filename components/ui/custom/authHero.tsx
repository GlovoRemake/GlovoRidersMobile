import {View, Text, Platform} from "react-native";

export function AuthHero() {
    return (
        <View className="absolute left-0 right-0 top-0 z-0 h-[310px] overflow-hidden bg-[#FFC244] px-6 pt-14 dark:bg-[#171A1D]">
            <View className="flex-1 items-center justify-center">
                <Text className="font-nunito-extrabold mt-3 text-[50px] tracking-tight text-[#00A082] dark:text-[#FFC244]">
                    Glovo
                </Text>

                <Text className="font-nunito-medium text-sm leading-none text-[#00A082]/60 dark:text-white/50">
                    Ласкаво просимо назад
                </Text>
            </View>
        </View>
    );
}
