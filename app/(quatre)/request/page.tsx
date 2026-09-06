import { Suspense } from "react";
import { RequestForm } from "@/components/quatre/RequestForm";
import { Loader } from "@/components/essentials/Loader";

const RequestPage = () => {
    return (
        <Suspense fallback={<Loader />}>
            <RequestForm />
        </Suspense>
    );
}

export default RequestPage;