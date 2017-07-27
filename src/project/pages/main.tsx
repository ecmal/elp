import system from "@ecmal/runtime";
import * as React from "@ecmal/react/react";

export interface IndexPageProperties {
    message: string;
}

export class MainComponent extends React.Component<IndexPageProperties> {
    static get(props: IndexPageProperties) {
        return <MainComponent {...props} />
    }
    public props: IndexPageProperties;
    render() {
        return (
            <div>
                <h1>{this.props.message}</h1>
                <Clock />
            </div>
        );
    }
}

export interface ClockState {
    date: Date;
}


class Clock extends React.Component {
    public state: ClockState;
    private timerID: any;
    setState;
    constructor(props) {
        super(props);
        this.state = { date: new Date() };
    }

    componentDidMount() {
        this.timerID = setInterval(
            () => this.tick(),
            1000
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    tick() {
        this.setState({
            date: new Date()
        });
    }

    render() {
        return (
            <div>
                <h1>The Clock</h1>
                <h2>It is {this.state.date.toLocaleTimeString()}.</h2>
            </div>
        );
    }
}