package th.go.xhealth.pcuqueuedisplay;

import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Locale;
import java.util.UUID;

@CapacitorPlugin(name = "QueueTts")
public class QueueTtsPlugin extends Plugin {
    private TextToSpeech tts;
    private boolean ready = false;

    @Override
    public void load() {
        tts = new TextToSpeech(getContext(), status -> {
            ready = status == TextToSpeech.SUCCESS;
            if (ready) tts.setLanguage(new Locale("th", "TH"));
        });
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        String lang = call.getString("lang", "th-TH");
        Double rateValue = call.getDouble("rate", 0.92);
        Double pitchValue = call.getDouble("pitch", 1.0);
        if (text == null || text.trim().isEmpty()) { call.resolve(); return; }
        if (!ready || tts == null) { call.reject("Android TextToSpeech is not ready. Install/enable a Thai TTS engine and retry."); return; }
        Locale locale = Locale.forLanguageTag(lang == null ? "th-TH" : lang);
        int languageStatus = tts.setLanguage(locale);
        if (languageStatus == TextToSpeech.LANG_MISSING_DATA || languageStatus == TextToSpeech.LANG_NOT_SUPPORTED) {
            JSObject result = new JSObject(); result.put("supported", false); call.resolve(result); return;
        }
        tts.setSpeechRate(rateValue == null ? 0.92f : rateValue.floatValue());
        tts.setPitch(pitchValue == null ? 1.0f : pitchValue.floatValue());
        final String utteranceId = UUID.randomUUID().toString();
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) { }
            @Override public void onError(String id) { if (utteranceId.equals(id)) call.reject("TTS playback failed"); }
            @Override public void onDone(String id) { if (utteranceId.equals(id)) { JSObject result = new JSObject(); result.put("supported", true); call.resolve(result); } }
        });
        Bundle params = new Bundle();
        int result = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId);
        if (result == TextToSpeech.ERROR) call.reject("Unable to start TTS");
    }

    @PluginMethod
    public void stop(PluginCall call) { if (tts != null) tts.stop(); call.resolve(); }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        super.handleOnDestroy();
    }
}
