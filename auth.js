import * as cookie from "cookie";
import jwt from "jsonwebtoken";

export function fetchRole(headerCookies) {
    console.log("Header cookies are: " + headerCookies);
    if (headerCookies === undefined) {
        return "Unauthorized";
    }
    const cookies = cookie.parse(headerCookies);
    if (cookies.Authorization === undefined || cookies.Authorization === null) {
        console.log("Cookie is undefined");
        return "Unauthorized";
    }
    console.log("SECRET KEY IS: " + process.env.JWT_SECRET_KEY);
    const auth = jwt.verify(cookies.Authorization, process.env.JWT_SECRET_KEY);
    console.log("Auth is: " + auth);
    return auth.role;
}

export function fetchId(headerCookies) {
    console.log("Header cookies are: " + headerCookies);
    if (headerCookies === undefined) {
        return "Unauthorized";
    }
    const cookies = cookie.parse(headerCookies);
    if (cookies.Authorization === undefined || cookies.Authorization === null) {
        return "Unauthorized";
    }
    const auth = jwt.verify(cookies.Authorization, process.env.JWT_SECRET_KEY);
    return auth.id;
}

export function checkAuth(rolesAuthorized, rolePassed) {
    console.log("Header cookies are: " + headerCookies);
    if (rolesAuthorized.includes(rolePassed))
        return true;
    return false;
}
