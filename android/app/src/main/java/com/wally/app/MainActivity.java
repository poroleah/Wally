package com.wally.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.UiModeManager;
import android.net.Uri;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.media.MediaMetadataRetriever;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import androidx.core.graphics.Insets;
import androidx.core.app.NotificationCompat;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.io.OutputStream;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private static final long SPLASH_DURATION_MS = 2500;
    private static final String THEME_PREFERENCES = "wally_theme";
    private static final String DARK_THEME_KEY = "dark_theme";
    private boolean immersiveStreamingMode = false;
    private boolean darkTheme = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        darkTheme = getSharedPreferences(THEME_PREFERENCES, Context.MODE_PRIVATE)
            .getBoolean(DARK_THEME_KEY, false);
        if (darkTheme) {
            setTheme(R.style.AppTheme_NoActionBarLaunchDark);
        }

        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setOnExitAnimationListener(splashScreenView -> splashScreenView.remove());
        configureEdgeToEdgeStatusBar();

        super.onCreate(savedInstanceState);
        configureWebViewInsets();
        getBridge().getWebView().addJavascriptInterface(new WallyGallery(this), "WallyGallery");
        getBridge().getWebView().addJavascriptInterface(new WallySystemUi(), "WallySystemUi");
        getBridge().getWebView().addJavascriptInterface(new WallyNotification(this), "WallyNotification");

        View splashView = getLayoutInflater().inflate(
            darkTheme ? R.layout.splash_screen_dark : R.layout.splash_screen,
            null
        );
        addContentView(
            splashView,
            new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        );

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            ViewGroup parent = (ViewGroup) splashView.getParent();
            if (parent != null) {
                parent.removeView(splashView);
            }
        }, SPLASH_DURATION_MS);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (getBridge() == null || getBridge().getWebView() == null) return;
        getBridge().getWebView().post(() ->
            getBridge().getWebView().evaluateJavascript(
                "window.dispatchEvent(new Event('wally:notification-open'))",
                null
            )
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && immersiveStreamingMode) {
            applySystemBarsVisibility(false);
        }
    }

    private void setImmersiveStreamingMode(boolean enabled) {
        immersiveStreamingMode = enabled;
        runOnUiThread(() -> applySystemBarsVisibility(!enabled));
    }

    private void applySystemBarsVisibility(boolean visible) {
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
            getWindow(),
            getWindow().getDecorView()
        );
        if (visible) {
            controller.show(WindowInsetsCompat.Type.systemBars());
            controller.setAppearanceLightStatusBars(!darkTheme);
            return;
        }

        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }

    private class WallySystemUi {
        @JavascriptInterface
        public void setImmersive(boolean enabled) {
            setImmersiveStreamingMode(enabled);
        }

        @JavascriptInterface
        public void setDarkTheme(boolean enabled) {
            darkTheme = enabled;
            getSharedPreferences(THEME_PREFERENCES, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(DARK_THEME_KEY, enabled)
                .apply();
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    UiModeManager uiModeManager = (UiModeManager) getSystemService(Context.UI_MODE_SERVICE);
                    if (uiModeManager != null) {
                        uiModeManager.setApplicationNightMode(
                            enabled ? UiModeManager.MODE_NIGHT_YES : UiModeManager.MODE_NIGHT_NO
                        );
                    }
                }

                WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
                    getWindow(),
                    getWindow().getDecorView()
                );
                controller.setAppearanceLightStatusBars(!enabled);
            });
        }
    }

    private class WallyNotification {
        private static final String CHANNEL_ID = "wally_abnormal";
        private static final String ACTION_MARKER = "wally_abnormal_notification";
        private final Context context;

        WallyNotification(Context context) {
            this.context = context.getApplicationContext();
        }

        @JavascriptInterface
        public void showAbnormal(
            int id,
            String title,
            String detail,
            String thumbnailUrl,
            String authToken,
            String date,
            String clip,
            int clipCount
        ) {
            Log.i(
                "WallyNotification",
                "Bridge received clip=" + safe(clip)
                    + " clipCount=" + clipCount
                    + " media=" + mediaKind(thumbnailUrl)
            );
            new Thread(() -> postAbnormalNotification(
                id,
                title,
                detail,
                thumbnailUrl,
                authToken,
                date,
                clip,
                clipCount
            )).start();
        }

        @JavascriptInterface
        public String consumeNavigation() {
            Intent intent = getIntent();
            if (intent == null || !intent.getBooleanExtra(ACTION_MARKER, false)) return "";

            try {
                JSONObject query = new JSONObject();
                String date = intent.getStringExtra("wally_notification_date");
                String clip = intent.getStringExtra("wally_notification_clip");
                int clipCount = intent.getIntExtra("wally_notification_clip_count", -1);
                if (date != null && !date.isEmpty()) query.put("date", date);
                if (clip != null && !clip.isEmpty()) query.put("clip", clip);
                if (clipCount >= 0) query.put("clip_count", clipCount);

                JSONObject target = new JSONObject();
                target.put("route", "/footprint");
                target.put("query", query);
                intent.removeExtra(ACTION_MARKER);
                return target.toString();
            } catch (Exception err) {
                Log.e("WallyNotification", "Failed to consume notification navigation", err);
                return "";
            }
        }

        private void postAbnormalNotification(
            int id,
            String title,
            String detail,
            String thumbnailUrl,
            String authToken,
            String date,
            String clip,
            int clipCount
        ) {
            Intent openIntent = new Intent(context, MainActivity.class);
            openIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            openIntent.putExtra(ACTION_MARKER, true);
            openIntent.putExtra("wally_notification_date", safe(date));
            openIntent.putExtra("wally_notification_clip", safe(clip));
            openIntent.putExtra("wally_notification_clip_count", clipCount);

            PendingIntent contentIntent = PendingIntent.getActivity(
                context,
                id,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_wally)
                .setContentTitle(safe(title))
                .setContentText(safe(detail))
                .setContentIntent(contentIntent)
                .setAutoCancel(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setVisibility(NotificationCompat.VISIBILITY_PRIVATE);

            Log.i("WallyNotification", "Preparing notification clip=" + safe(clip) + " media=" + mediaKind(thumbnailUrl));
            Bitmap thumbnail = null;
            if (thumbnailUrl != null && !thumbnailUrl.trim().isEmpty()) {
                thumbnail = downloadThumbnail(thumbnailUrl, authToken);
            }
            if (thumbnail != null) {
                builder
                    .setLargeIcon(thumbnail)
                    .setStyle(
                        new NotificationCompat.BigPictureStyle()
                            .bigPicture(thumbnail)
                            .bigLargeIcon((Bitmap) null)
                            .setSummaryText(safe(detail))
                    );
            } else {
                builder.setStyle(new NotificationCompat.BigTextStyle().bigText(safe(detail)));
            }

            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            manager.notify(id, builder.build());
            Log.i("WallyNotification", "Notification posted clip=" + safe(clip) + " image=" + (thumbnail != null));
        }

        private String mediaKind(String source) {
            if (source == null || source.trim().isEmpty()) return "empty";
            if (source.startsWith("data:image/")) return "inline-image";
            return "remote-media";
        }

        private Bitmap downloadThumbnail(String source, String authToken) {
            if (source == null || source.trim().isEmpty()) {
                Log.w("WallyNotification", "Thumbnail source is empty");
                return null;
            }
            if (source.startsWith("data:image/")) {
                try {
                    int separator = source.indexOf(',');
                    byte[] decoded = Base64.decode(source.substring(separator + 1), Base64.DEFAULT);
                    return BitmapFactory.decodeByteArray(decoded, 0, decoded.length);
                } catch (Exception err) {
                    Log.w("WallyNotification", "Inline thumbnail decode failed", err);
                    return null;
                }
            }
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(source).openConnection();
                connection.setConnectTimeout(5000);
                connection.setReadTimeout(7000);
                if (authToken != null && !authToken.trim().isEmpty()) {
                    connection.setRequestProperty("Authorization", "Bearer " + authToken.trim());
                }
                connection.connect();
                int responseCode = connection.getResponseCode();
                if (responseCode < 200 || responseCode >= 300) {
                    Log.w("WallyNotification", "Thumbnail HTTP response: " + responseCode);
                    return null;
                }
                try (InputStream input = connection.getInputStream();
                     ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                    byte[] buffer = new byte[16 * 1024];
                    int count;
                    while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
                    byte[] media = output.toByteArray();
                    Bitmap bitmap = BitmapFactory.decodeByteArray(media, 0, media.length);
                    if (bitmap == null) bitmap = extractVideoThumbnail(media);
                    if (bitmap == null) return null;
                    Log.i("WallyNotification", "Thumbnail ready " + bitmap.getWidth() + "x" + bitmap.getHeight());
                    int width = bitmap.getWidth();
                    int height = bitmap.getHeight();
                    int longest = Math.max(width, height);
                    if (longest <= 1024) return bitmap;
                    float scale = 1024f / longest;
                    return Bitmap.createScaledBitmap(
                        bitmap,
                        Math.max(1, Math.round(width * scale)),
                        Math.max(1, Math.round(height * scale)),
                        true
                    );
                }
            } catch (Exception err) {
                Log.w("WallyNotification", "Thumbnail download failed", err);
                return null;
            } finally {
                if (connection != null) connection.disconnect();
            }
        }

        private Bitmap extractVideoThumbnail(byte[] media) {
            File temporaryFile = null;
            MediaMetadataRetriever retriever = new MediaMetadataRetriever();
            try {
                temporaryFile = File.createTempFile("wally_notification_", ".mp4", context.getCacheDir());
                try (FileOutputStream output = new FileOutputStream(temporaryFile)) {
                    output.write(media);
                }
                retriever.setDataSource(temporaryFile.getAbsolutePath());
                return retriever.getFrameAtTime(0, MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
            } catch (Exception err) {
                Log.w("WallyNotification", "Video thumbnail extraction failed", err);
                return null;
            } finally {
                try {
                    retriever.release();
                } catch (Exception ignored) {
                }
                if (temporaryFile != null && temporaryFile.exists()) temporaryFile.delete();
            }
        }

        private String safe(String value) {
            return value == null ? "" : value;
        }
    }

    private void configureEdgeToEdgeStatusBar() {
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(true);
    }

    private void configureWebViewInsets() {
        View decorView = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (view, windowInsets) -> {
            Insets safeInsets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            float density = getResources().getDisplayMetrics().density;
            String script = String.format(
                Locale.US,
                "document.documentElement.style.setProperty('--wally-safe-top','%.2fpx');" +
                "document.documentElement.style.setProperty('--wally-safe-left','%.2fpx');" +
                "document.documentElement.style.setProperty('--wally-safe-right','%.2fpx');" +
                "document.documentElement.style.setProperty('--wally-safe-bottom','%.2fpx');",
                safeInsets.top / density,
                safeInsets.left / density,
                safeInsets.right / density,
                safeInsets.bottom / density
            );
            getBridge().getWebView().evaluateJavascript(script, null);
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(decorView);
    }

    public static class WallyGallery {
        private static final String TAG = "WallyGallery";
        private final Context context;
        private final ConcurrentHashMap<String, PendingVideo> pendingVideos = new ConcurrentHashMap<>();

        private static class PendingVideo {
            final Uri uri;
            final OutputStream output;

            PendingVideo(Uri uri, OutputStream output) {
                this.uri = uri;
                this.output = output;
            }
        }

        WallyGallery(Context context) {
            this.context = context.getApplicationContext();
        }

        @JavascriptInterface
        public boolean saveImage(String dataUrl, String filename) {
            return saveMedia(dataUrl, filename, "image/jpeg", "Pictures/Wally", MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        }

        @JavascriptInterface
        public boolean saveVideo(String dataUrl, String filename) {
            return saveMedia(dataUrl, filename, resolveVideoMimeType(dataUrl, filename), "Movies/Wally", MediaStore.Video.Media.EXTERNAL_CONTENT_URI);
        }

        @JavascriptInterface
        public String beginVideoSave(String filename, String mimeType) {
            ContentResolver resolver = context.getContentResolver();
            Uri uri = null;
            try {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, sanitizeFilename(filename));
                values.put(MediaStore.MediaColumns.MIME_TYPE, normalizeVideoMimeType(mimeType, filename));
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, "Movies/Wally");
                    values.put(MediaStore.MediaColumns.IS_PENDING, 1);
                }

                uri = resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values);
                if (uri == null) return "";
                OutputStream output = resolver.openOutputStream(uri);
                if (output == null) {
                    resolver.delete(uri, null, null);
                    return "";
                }

                String token = UUID.randomUUID().toString();
                pendingVideos.put(token, new PendingVideo(uri, output));
                return token;
            } catch (Exception err) {
                if (uri != null) resolver.delete(uri, null, null);
                Log.e(TAG, "Failed to start video save", err);
                return "";
            }
        }

        @JavascriptInterface
        public boolean appendVideoChunk(String token, String base64Chunk) {
            PendingVideo pending = pendingVideos.get(token);
            if (pending == null) return false;
            try {
                byte[] bytes = Base64.decode(base64Chunk == null ? "" : base64Chunk, Base64.DEFAULT);
                pending.output.write(bytes);
                return true;
            } catch (Exception err) {
                Log.e(TAG, "Failed to append video chunk", err);
                abortVideoSave(token);
                return false;
            }
        }

        @JavascriptInterface
        public boolean finishVideoSave(String token) {
            PendingVideo pending = pendingVideos.remove(token);
            if (pending == null) return false;
            try {
                pending.output.flush();
                pending.output.close();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    context.getContentResolver().update(pending.uri, values, null, null);
                }
                return true;
            } catch (Exception err) {
                context.getContentResolver().delete(pending.uri, null, null);
                Log.e(TAG, "Failed to finish video save", err);
                return false;
            }
        }

        @JavascriptInterface
        public void abortVideoSave(String token) {
            PendingVideo pending = pendingVideos.remove(token);
            if (pending == null) return;
            try {
                pending.output.close();
            } catch (Exception ignored) {
                // The incomplete MediaStore item is deleted below.
            }
            context.getContentResolver().delete(pending.uri, null, null);
        }

        private boolean saveMedia(String dataUrl, String filename, String mimeType, String relativePath, Uri collectionUri) {
            try {
                byte[] bytes = decodeDataUrl(dataUrl);
                if (bytes.length == 0) return false;

                ContentResolver resolver = context.getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, sanitizeFilename(filename));
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath);
                    values.put(MediaStore.MediaColumns.IS_PENDING, 1);
                }

                Uri uri = resolver.insert(collectionUri, values);
                if (uri == null) return false;

                try (OutputStream output = resolver.openOutputStream(uri)) {
                    if (output == null) return false;
                    output.write(bytes);
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    values.clear();
                    values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    resolver.update(uri, values, null, null);
                }

                return true;
            } catch (Exception err) {
                Log.e(TAG, "Failed to save media", err);
                return false;
            }
        }

        private byte[] decodeDataUrl(String dataUrl) {
            String value = dataUrl == null ? "" : dataUrl;
            int commaIndex = value.indexOf(',');
            String base64 = commaIndex >= 0 ? value.substring(commaIndex + 1) : value;
            return Base64.decode(base64, Base64.DEFAULT);
        }

        private String sanitizeFilename(String filename) {
            String value = filename == null ? "" : filename.trim();
            if (value.isEmpty()) return "wally_media";
            return value.replaceAll("[\\\\/:*?\"<>|]", "_");
        }

        private String resolveVideoMimeType(String dataUrl, String filename) {
            String source = ((dataUrl == null ? "" : dataUrl) + " " + (filename == null ? "" : filename)).toLowerCase();
            if (source.contains("video/mp4") || source.endsWith(".mp4")) return "video/mp4";
            if (source.contains("video/webm") || source.endsWith(".webm")) return "video/webm";
            if (source.contains("video/quicktime") || source.endsWith(".mov")) return "video/quicktime";
            return "video/webm";
        }

        private String normalizeVideoMimeType(String mimeType, String filename) {
            String value = mimeType == null ? "" : mimeType.trim().toLowerCase();
            if (value.startsWith("video/")) return value.split(";", 2)[0];
            return resolveVideoMimeType("", filename);
        }
    }
}
