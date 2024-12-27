export class FlashModel {
    count: number = $state(0);

    constructor() {
        this.count = 0;
    }

    increment() {
        this.count++;
    }
}