import { Button, Card, CardBody, CardHeader, Link } from "@nextui-org/react";
import { CreateGroupMenu } from "../controls/CreateGroupMenu";

interface FeatureItem {
    title: string;
    description: string;
}

const features: FeatureItem[] = [
    {
        title: "Get right to it",
        description: "Simply input expenses and participants, and you're good to go! No need for registration, app downloads, or SMS hassle."
    },
    {
        title: "No ads",
        description: "No pesky ads to divert your focus from what matters most."
    },
    {
        title: "Open source and free",
        description: "Access all our source code on GitHub. No hidden fees or premium features."
    },
    {
        title: "Easy sharing",
        description: "Share your group and expenses effortlessly by sending the app's link."
    },
    {
        title: "Public API",
        description: "With a public API, you can customize your own user interface or export expenses as needed."
    }
];

export function About() {

    return (
        <>
            <h1 className="text-4xl font-bold mt-24">Share Expenses</h1>
            <h5 className="text-xl text-dimmed mt-2">Intuitive, Clean and Free. Ads Free.</h5>
            <Button 
                color="primary" 
                className="mt-20" 
                variant="solid"
                as={Link}
                href="/create"
            >
                Create Group
            </Button>

            <h5 className="text-xl font-bold mt-20">Motivaition</h5>
            <div className="flex text-sm text-dimmed p-5 text-justify">
                The SplitWise app has been a long-standing tool for managing shared expenses, but its recent shift towards a cumbersome UI, an increase in advertisements, and the gating of essential features behind a subscription paywall has lessened its appeal.
                <br/>
                Here is a yet another application that offers a free, straightforward, and intuitive way for managing shared costs. 
            </div>

            <h5 className="text-xl font-bold mt-5">Features</h5>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mt-unit-10">
                { features.map((feature, index) => 
                    <Card className={`max-w-[170px] h-[170px]`} key={index}>
                        <CardHeader className="py-2">
                            <p  className="text-sm font-bold">{feature.title}</p>
                        </CardHeader>
                        <CardBody className="pt-0">
                            <p className="text-sm text-dimmed">
                                {feature.description}
                            </p>
                        </CardBody>
                    </Card>
                )}
            </div>
            <CreateGroupMenu />
        </>
    )
}