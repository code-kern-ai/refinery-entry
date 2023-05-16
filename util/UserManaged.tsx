import { memo, use, useEffect, useState } from "react";
import { MiscInfo } from "../services/basic-fetch/misc";
import { getIsDemo, getIsManaged } from "./data-fetch";

function GetUserManagerWrapper(props: React.PropsWithChildren) {
    const [dataLoaded, setDataLoaded] = useState(false);

    const [isManaged, setIsManaged] = useState(null);
    const [isDemo, setIsDemo] = useState(null);


    useEffect(() => {
        getIsManaged((data) => {
            setIsManaged(data);
        });
        getIsDemo((data) => {
            setIsDemo(data);
        });
    }, []);

    useEffect(() => {
        if (isManaged == null || isDemo == null) return;
        MiscInfo.isManaged = isManaged;
        MiscInfo.isDemo = isDemo;
        setDataLoaded(true);
    }, [isManaged, isDemo]);
    if (!dataLoaded) return null;
    return <div>{props.children}</div>;
}

export const UserManagerWrapper = memo(GetUserManagerWrapper);