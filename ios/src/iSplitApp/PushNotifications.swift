import WebKit
import FirebaseMessaging

// Store the last FCM token to prevent duplicate dispatches
private var lastFcmToken: String?

/**
 Call the JS event in the react app
 */
func dispatchToJs<T: Codable>(event: String, data: T) {
    DispatchQueue.main.async {
        print("try to dispatch event: \(event)")
        if (!iSplitApp.webView.isHidden && !iSplitApp.webView.isLoading ) {
            do {
                let jsonData = try JSONEncoder().encode(data)
                let json = String(data: jsonData, encoding: .utf8)!
                iSplitApp.webView.evaluateJavaScript("this.dispatchEvent(new CustomEvent('\(event)', { detail: \(json) }))")
                print("dispatch ok")
            } catch {
                print("dispatch error")
                return
            }
        }
        else {
            print("webview not ready, run later")
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                dispatchToJs(event: event, data: data)
            }
        }
    }
}

/**
 * Open specific Url
 */
func openPath(urlPath: String) {
    DispatchQueue.main.async {
        if (!iSplitApp.webView.isHidden && !iSplitApp.webView.isLoading ) {
            iSplitApp.webView.evaluateJavaScript("window.location.replace('\(urlPath)')")
        }
        else {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                openPath(urlPath: urlPath)
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
                    // Only dispatch if token has changed
                    if lastFcmToken != token {
                        print("Success fetching FCM registration token: \(token)")
                        lastFcmToken = token
                        dispatchToJs(
                            event:"register-subscription",
                            data: RegistrationResult(isRegistrationSuccess: true, fcmToken: token)
                        )
                    } else {
                        print("FCM token unchanged, skipping dispatch: \(token)")
                    }
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
                        // Reset last token to ensure registration event is sent after permission granted
                        lastFcmToken = nil
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
