import { loadStripe } from "@stripe/stripe-js";
import { paymentService } from "@/services/payment.service";

let stripePromise = null;

export async function getStripe() {
    if (!stripePromise) {
        const config = await paymentService.getStripeConfig();
        stripePromise = loadStripe(config.publishableKey);
    }
    return stripePromise;
}