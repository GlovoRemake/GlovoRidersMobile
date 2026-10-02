import {IProfile} from "@/types/account/IProfile";
import {OrderStatus} from "@/types/order/OrderStatus";
import {PaymentMethod} from "@/types/order/PaymentMethod";

export interface IOrder {
    id: number;
    user: IProfile;

    company: {
        id: string;
        name: string;
        description: string;
        iconPath: string;
        bannerPath: string;
        ownerId: string;
    }

    affiliate: {
        id: string;
        phone: string;
        email: string;
        location: {
            regionId: number;
            region: string;
            location: string;
            address: string;
            postalIndex: string;
        }
    }

    userLocation: {
        id: number;
        address: string;
        location: string;
        city: {
            id: number;
            name: string;
            region: {
                id: number;
                name: string;
            }
        }
    }

    totalPrice: number;
    productsPrice: number;
    deliveryFee: number;
    fee: number;
    tipPercent: number;
    tipAmount: number;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    courier: IProfile;


    products: {
        productId: number;
        count: number;
        price: number;

        additionals: {


            additionalId: number;
            price: number;
        }[]
    }[]
}