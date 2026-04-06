package com.folio.app.util

import java.text.SimpleDateFormat
import java.util.*

fun formatRelativeDate(dateString: String?): String {
    if (dateString == null) return ""
    return try {
        val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        format.timeZone = TimeZone.getTimeZone("UTC")
        val date = format.parse(dateString) ?: return dateString
        val diff = (System.currentTimeMillis() - date.time) / 1000

        when {
            diff < 60 -> "только что"
            diff < 3600 -> "${diff / 60} мин. назад"
            diff < 86400 -> "${diff / 3600} ч. назад"
            diff < 604800 -> "${diff / 86400} дн. назад"
            else -> {
                val df = SimpleDateFormat("dd.MM.yyyy", Locale("ru"))
                df.format(date)
            }
        }
    } catch (e: Exception) {
        dateString
    }
}

fun formatDate(dateString: String?): String {
    if (dateString == null) return ""
    return try {
        val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        format.timeZone = TimeZone.getTimeZone("UTC")
        val date = format.parse(dateString) ?: return dateString
        val df = SimpleDateFormat("dd MMMM yyyy", Locale("ru"))
        df.format(date)
    } catch (e: Exception) {
        dateString
    }
}

fun formatTime(dateString: String?): String {
    if (dateString == null) return ""
    return try {
        val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        format.timeZone = TimeZone.getTimeZone("UTC")
        val date = format.parse(dateString) ?: return dateString
        val df = SimpleDateFormat("HH:mm", Locale.getDefault())
        df.format(date)
    } catch (e: Exception) {
        dateString
    }
}
