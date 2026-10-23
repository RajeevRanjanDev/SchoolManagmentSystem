package com.sms.school.util;

import java.security.SecureRandom;

/** Helpers for generating temporary passwords. */
public final class PasswordUtils {

    private PasswordUtils() {}

    private static final SecureRandom RANDOM = new SecureRandom();
    // Avoid ambiguous chars (0/O, 1/l/I) so temp passwords are easy to read/type.
    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijkmnpqrstuvwxyz";
    private static final String DIGITS = "23456789";
    private static final String SPECIAL = "@#$%&*";
    private static final String ALL = UPPER + LOWER + DIGITS + SPECIAL;

    /** Generate a 10-char temp password containing at least one of each class. */
    public static String generateTempPassword() {
        StringBuilder sb = new StringBuilder();
        sb.append(pick(UPPER));
        sb.append(pick(LOWER));
        sb.append(pick(DIGITS));
        sb.append(pick(SPECIAL));
        for (int i = 0; i < 6; i++) sb.append(pick(ALL));
        // Shuffle so the guaranteed chars aren't always at the front.
        char[] chars = sb.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = RANDOM.nextInt(i + 1);
            char tmp = chars[i]; chars[i] = chars[j]; chars[j] = tmp;
        }
        return new String(chars);
    }

    private static char pick(String set) {
        return set.charAt(RANDOM.nextInt(set.length()));
    }
}
