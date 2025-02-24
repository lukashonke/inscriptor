import MD5 from "crypto-js/md5";

export function md5(data) {
  return MD5(data).toString();
}
