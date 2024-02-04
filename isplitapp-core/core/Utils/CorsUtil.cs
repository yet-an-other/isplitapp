using System.Text.RegularExpressions;

namespace IB.ISplitApp.Core.Utils;

public static partial class CorsUtil
{
    [GeneratedRegex("localhost:\\d{1,5}|isplit.app|dev.isplit.app|apidev.isplit.app|api.isplit.app")]
    public static partial Regex IsValidOrigin();
}