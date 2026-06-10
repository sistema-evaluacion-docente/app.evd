import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import localeEs from "dayjs/locale/es";

dayjs.extend(utc);
dayjs.locale(localeEs);

function formatDate(value: string) {
  console.log(value);
  return dayjs(value).format("MMMM D, YYYY h:mm A");
}

export default formatDate;
