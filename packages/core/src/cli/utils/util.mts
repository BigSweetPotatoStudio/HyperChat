import dayjs from "dayjs";
import { v4 } from "uuid";

export function getMyUuid() {
    // Generate a UUID using the built-in crypto API
    return dayjs().format('YYMMDD-HHmmss') + '-' + v4().slice(0, 8);
}