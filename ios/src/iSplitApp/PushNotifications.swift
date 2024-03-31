import WebKit
import FirebaseMessaging

class SubscribeMessage {
    var topic  = ""
    var eventValue = ""
    var unsubscribe = false
    struct Keys {
        static var TOPIC = "topic"
        static var UNSUBSCRIBE = "unsubscribe"
        static var EVENTVALUE = "eventValue"
    }
    convenience init(dict: Dictionary<String,Any>) {
        self.init()
        if let topic = dict[Keys.TOPIC] as? String {
            self.topic = topic
        }
        if let unsubscribe = dict[Keys.UNSUBSCRIBE] as? Bool {
            self.unsubscribe = unsubscribe
        }
        if let eventValue = dict[Keys.EVENTVALUE] as? String {
            self.eventValue = eventValue
        }
    }
}

func handleSubscribeTouch(message: WKScriptMessage) {
  // [START subscribe_topic]
    let subscribeMessages = parseSubscribeMessage(message: message)
    if (subscribeMessages.count > 0){
        let _message = subscribeMessages[0]
        if (_message.unsubscribe) {
            Messaging.messaging().unsubscribe(fromTopic: _message.topic) { error in }
        }
        else {
            Messaging.messaging().subscribe(toTopic: _message.topic) { error in }
        }
    }
    

  // [END subscribe_topic]
}

func parseSubscribeMessage(message: WKScriptMessage) -> [SubscribeMessage] {
    var subscribeMessages = [SubscribeMessage]()
    if let objStr = message.body as? String {

        let data: Data = objStr.data(using: .utf8)!
        do {
            let jsObj = try JSONSerialization.jsonObject(with: data, options: .init(rawValue: 0))
            if let jsonObjDict = jsObj as? Dictionary<String, Any> {
                let subscribeMessage = SubscribeMessage(dict: jsonObjDict)
                subscribeMessages.append(subscribeMessage)
            } else if let jsonArr = jsObj as? [Dictionary<String, Any>] {
                for jsonObj in jsonArr {
                    let sMessage = SubscribeMessage(dict: jsonObj)
                    subscribeMessages.append(sMessage)
                }
            }
        } catch _ {
            
        }
    }
    return subscribeMessages
}

func returnPermissionResult(isGranted: Bool){
    DispatchQueue.main.async(execute: {
        if (isGranted){
            iSplitApp.webView.evaluateJavaScript("this.dispatchEvent(new CustomEvent('push-permission-request', { detail: 'granted' }))")
        }
        else {
            iSplitApp.webView.evaluateJavaScript("this.dispatchEvent(new CustomEvent('push-permission-request', { detail: 'denied' }))")
        }
    })
}
func returnPermissionState(state: String){
    DispatchQueue.main.async(execute: {
        iSplitApp.webView.evaluateJavaScript("this.dispatchEvent(new CustomEvent('push-permission-state', { detail: '\(state)' }))")
    })
}

func handlePushPermission() {
    UNUserNotificationCenter.current().getNotificationSettings () { settings in
            switch settings.authorizationStatus {
            case .notDetermined:
                let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
                UNUserNotificationCenter.current().requestAuthorization(
                    options: authOptions,
                    completionHandler: { (success, error) in
                        if error == nil {
                            if success == true {
                                returnPermissionResult(isGranted: true)
                                DispatchQueue.main.async {
                                  UIApplication.shared.registerForRemoteNotifications()
                                }
                            }
                            else {
                                returnPermissionResult(isGranted: false)
                            }
                        }
                        else {
                            returnPermissionResult(isGranted: false)
                        }
                    }
                )
            case .denied:
                returnPermissionResult(isGranted: false)
            case .authorized, .ephemeral, .provisional:
                returnPermissionResult(isGranted: true)
            @unknown default:
                return;
            }
        }
}
func handlePushState() {
    UNUserNotificationCenter.current().getNotificationSettings () { settings in
        switch settings.authorizationStatus {
        case .notDetermined:
            returnPermissionState(state: "notDetermined")
        case .denied:
            returnPermissionState(state: "denied")
        case .authorized:
            returnPermissionState(state: "authorized")
        case .ephemeral:
            returnPermissionState(state: "ephemeral")
        case .provisional:
            returnPermissionState(state: "provisional")
        @unknown default:
            returnPermissionState(state: "unknown")
            return;
        }
    }
}

func checkViewAndEvaluate(event: String, detail: String) {
    if (!iSplitApp.webView.isHidden && !iSplitApp.webView.isLoading ) {
        DispatchQueue.main.async(execute: {
            iSplitApp.webView.evaluateJavaScript("this.dispatchEvent(new CustomEvent('\(event)', { detail: { fcmToken: \(detail) }}))")
        })
    }
    else {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            checkViewAndEvaluate(event: event, detail: detail)
        }
    }
    print("send message");
}

func handleFCMToken(){
    DispatchQueue.main.async(execute: {
        Messaging.messaging().token { token, error in
            if let error = error {
                print("Error fetching FCM registration token: \(error)")
                checkViewAndEvaluate(event: "register-subscription", detail: "ERROR GET TOKEN")
            } else if let token = token {
                print("FCM registration token: \(token)")
                checkViewAndEvaluate(event: "register-subscription", detail: "'\(token)'")
            }
        }   
    })
}

func sendPushToWebView(userInfo: [AnyHashable: Any]){
    var json = "";
    do {
        let jsonData = try JSONSerialization.data(withJSONObject: userInfo)
        json = String(data: jsonData, encoding: .utf8)!
    } catch {
        print("ERROR: userInfo parsing problem")
        return
    }
    checkViewAndEvaluate(event: "push-notification", detail: json)
}



/**
 Call the JS event in the react app
 */
func dispatchToJs<T: Codable>(event: String, data: T) {
    DispatchQueue.main.async {
        if (!iSplitApp.webView.isHidden && !iSplitApp.webView.isLoading ) {
            do {
                let jsonData = try JSONEncoder().encode(data)
                let json = String(data: jsonData, encoding: .utf8)!
                iSplitApp.webView.evaluateJavaScript("this.dispatchEvent(new CustomEvent('\(event)', { detail: \(json) }))")
            } catch {
                print("dispatch error")
                return
            }
        }
        else {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                dispatchToJs(event: event, data: data)
            }
        }
    }
}

/**
 * Get actual token and push it into the react app
 */
func pushActualFcmToken() {
    DispatchQueue.main.async {
        
        UNUserNotificationCenter.current().getNotificationSettings () { settings in
            
            if settings.authorizationStatus == .denied ||
                settings.authorizationStatus == .notDetermined {
                print("Notification permissions are not granted")
                return
            }
            
            Messaging.messaging().token { token, error in
                if let error = error {
                    print("Error fetching FCM registration token: \(error)")
                    dispatchToJs(
                        event:"register-subscription",
                        data: RegistrationResult(isRegistrationSuccess: false, error: error.localizedDescription)
                    )
                } else if let token = token {
                    print("Success fetching FCM registration token: \(token)")
                    dispatchToJs(
                        event:"register-subscription",
                        data: RegistrationResult(isRegistrationSuccess: true, fcmToken: token)
                    )
                }
            }
        }
    }
}

/**
 * Request notification permission if status is not determined and push the result to the react app
 */
func requestNotificationPermission() {
    UNUserNotificationCenter.current().getNotificationSettings () { settings in
        
        if (settings.authorizationStatus == .notDetermined) {
            UNUserNotificationCenter.current().requestAuthorization(
                options:  [.alert, .badge, .sound],
                completionHandler: { (success, error) in
                    if error == nil && success == true {
                        dispatchPermissionGranted()
                        pushActualFcmToken()
                    }
                    else {
                        dispatchPermissionDenied(reason: error?.localizedDescription)
                    }
                }
            )
        }
    }
}

/**
 * Check permission status and push the result into the react app
 */
func checkPermissionStatus() {
    UNUserNotificationCenter.current().getNotificationSettings () { settings in
        switch settings.authorizationStatus {
        case .notDetermined:
            dispatchPermissionNotDetermined()
        case .denied:
            dispatchPermissionDenied()
        case .authorized, .ephemeral, .provisional:
            dispatchPermissionGranted()
        @unknown default:
            return;
        }
    }
}

func dispatchPermissionGranted() {
    dispatchToJs(
        event:"permission-status",
        data: PermissionStatus(permissionStatus: "granted")
    )
}

func dispatchPermissionDenied(reason: String? = "") {
    dispatchToJs(
        event:"permission-status",
        data: PermissionStatus(permissionStatus: "denied", reason: reason)
    )
}

func dispatchPermissionNotDetermined() {
    dispatchToJs(
        event:"permission-status",
        data: PermissionStatus(permissionStatus: "not-determined")
    )
}

struct RegistrationResult: Codable {
    var isRegistrationSuccess: Bool
    var fcmToken: String?
    var error: String?
}

struct PermissionStatus: Codable {
    var permissionStatus: String
    var reason: String?
}
