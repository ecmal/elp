export as namespace ReactDOM;

import {
    ReactInstance, Component, ComponentState,
    ReactElement, SFCElement, CElement,
    DOMAttributes, DOMElement
} from './react';

export function findDOMNode<E extends object>(instance: ReactInstance): E;
export function findDOMNode(instance: ReactInstance): object;

export function render<P extends DOMAttributes<T>, T extends object>(
    element: DOMElement<P, T>,
    container: object | null,
    callback?: (element: T) => any
): T;
export function render<P>(
    element: SFCElement<P>,
    container: object | null,
    callback?: () => any
): void;
export function render<P, T extends Component<P, ComponentState>>(
    element: CElement<P, T>,
    container: object | null,
    callback?: (component: T) => any
): T;
export function render<P>(
    element: ReactElement<P>,
    container: object | null,
    callback?: (component?: Component<P, ComponentState> | object) => any
): Component<P, ComponentState> | object | void;
export function render<P>(
    parentComponent: Component<any>,
    element: SFCElement<P>,
    container: object,
    callback?: () => any
): void;

export function unmountComponentAtNode(container: object): boolean;

export const version: string;

export function unstable_batchedUpdates<A, B>(callback: (a: A, b: B) => any, a: A, b: B): void;
export function unstable_batchedUpdates<A>(callback: (a: A) => any, a: A): void;
export function unstable_batchedUpdates(callback: () => any): void;

export function unstable_renderSubtreeIntoContainer<P extends DOMAttributes<T>, T extends object>(
    parentComponent: Component<any>,
    element: DOMElement<P, T>,
    container: object,
    callback?: (element: T) => any): T;
export function unstable_renderSubtreeIntoContainer<P, T extends Component<P, ComponentState>>(
    parentComponent: Component<any>,
    element: CElement<P, T>,
    container: object,
    callback?: (component: T) => any): T;
export function unstable_renderSubtreeIntoContainer<P>(
    parentComponent: Component<any>,
    element: ReactElement<P>,
    container: object,
    callback?: (component?: Component<P, ComponentState> | object) => any): Component<P, ComponentState> | object | void;
