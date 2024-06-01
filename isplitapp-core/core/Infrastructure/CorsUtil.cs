using System.Text.RegularExpressions;

namespace IB.ISplitApp.Core.Infrastructure;

public static partial class CorsUtil
{
    [GeneratedRegex(
        "localhost:\\d{1,5}|isplit.app|dev.isplit.app|apidev.isplit.app|api.isplit.app|192.168.111.36:?\\d{1,5}")]
    public static partial Regex IsValidOrigin();
}