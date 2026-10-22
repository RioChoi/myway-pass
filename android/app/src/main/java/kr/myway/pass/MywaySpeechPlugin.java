package kr.myway.pass;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.speech.RecognizerIntent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;

@CapacitorPlugin(name="MywaySpeech",permissions={@Permission(alias="microphone",strings={Manifest.permission.RECORD_AUDIO})})
public class MywaySpeechPlugin extends Plugin {
  @PluginMethod public void listen(PluginCall call){
    if(getPermissionState("microphone")!=PermissionState.GRANTED){requestPermissionForAlias("microphone",call,"permissionResult");return;}
    launch(call);
  }
  @PermissionCallback private void permissionResult(PluginCall call){
    if(getPermissionState("microphone")==PermissionState.GRANTED)launch(call);else call.reject("마이크 권한이 필요합니다.");
  }
  private void launch(PluginCall call){
    Intent intent=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE,"ko-KR");
    intent.putExtra(RecognizerIntent.EXTRA_PROMPT,"불편한 점을 말씀해 주세요");
    intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE,true);
    try{startActivityForResult(call,intent,"speechResult");}catch(Exception error){call.reject("음성 인식 앱을 사용할 수 없습니다.");}
  }
  @ActivityCallback private void speechResult(PluginCall call,ActivityResult result){
    if(call==null)return;
    if(result.getResultCode()!=Activity.RESULT_OK||result.getData()==null){call.reject("음성 입력이 취소되었습니다.");return;}
    ArrayList<String> matches=result.getData().getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
    if(matches==null||matches.isEmpty()){call.reject("인식된 문장이 없습니다.");return;}
    JSObject value=new JSObject();value.put("text",matches.get(0));call.resolve(value);
  }
}
