import {useCurrentOrderQuery} from "@/store/service/apiOrders";
import CourierScreen from "./ordersList";
import CurrentOrder from "./currentOrder";

export default function orderLogic() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const {data, isLoading} = useCurrentOrderQuery();

    if (data == null)
    {
        return (
            <CourierScreen />
        )
    } else {
        return (
            <CurrentOrder />
        )
    }
}