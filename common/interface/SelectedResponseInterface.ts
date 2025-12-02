import {ItemsResponseInterface} from "./ItemsResponseInterface";

export interface SelectedResponseInterface extends ItemsResponseInterface {
    order: number[];
}