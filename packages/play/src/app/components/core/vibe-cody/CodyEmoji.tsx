import * as React from 'react';
import {CSSProperties, useContext} from "react";
import {ColorModeContext} from "@frontend/app/providers/ToggleColorMode";
// tslint:disable-next-line:no-var-requires
const codyEmojiLight = require('../../../../assets/cody_light.svg').default;
// tslint:disable-next-line:no-var-requires
const codyEmojiDark = require('../../../../assets/cody_dark.svg').default;

interface OwnProps {
    width?: number;
    style?: CSSProperties;
}

type CodyEmojiProps = OwnProps;

const CodyEmoji = (props: CodyEmojiProps) => {
    const width = props.width || 30;
    const {mode} = useContext(ColorModeContext);

    return <object className="console-avatar" data={mode === "dark" ? codyEmojiDark : codyEmojiLight} type="image/svg+xml" style={{width: width+'px', ...props.style}}/>;
};

export default CodyEmoji;
