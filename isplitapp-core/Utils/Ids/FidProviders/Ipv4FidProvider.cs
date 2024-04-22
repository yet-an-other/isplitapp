using System.Diagnostics;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;

namespace IB.Utils.Ids.FidProviders;

/// <summary>
/// Factory id provider based on IP v4 address of machine or container where the service is running
/// </summary>
public class Ipv4FidProvider: IFidProvider
{
    /// <summary>
    /// Returns unique id based on ip address
    /// </summary>
    /// <param name="maxFactoryId">maximum possible id</param>
    /// <returns>unique id as right X bits of 32 bit ip address</returns>
    /// <exception cref="ApplicationException">If IP is not available</exception>
    public uint GetFactoryId(uint maxFactoryId)
    {
        var networkInterfaces = NetworkInterface.GetAllNetworkInterfaces();
        foreach (var network in networkInterfaces)
        {
            if (network.OperationalStatus != OperationalStatus.Up)
                continue;

            var properties = network.GetIPProperties();
            
            if (properties.GatewayAddresses.Count == 0)
                continue;

            foreach (var address in properties.UnicastAddresses)
            {
                if (address.Address.AddressFamily != AddressFamily.InterNetwork)
                    continue;

                if (IPAddress.IsLoopback(address.Address))
                    continue;

                Debug.WriteLine("Use ip: {0}", address.Address.ToString());
                return Bytes2Uint(address.Address.GetAddressBytes()) & maxFactoryId;
            }
        }

        throw new ApplicationException("Unable to find suitable IP");
    }

    private static uint Bytes2Uint(byte[] ipAddress) =>
        ipAddress.Aggregate<byte, uint>(0, (current, addressByte) => (current << 8) + addressByte);

    private static byte[] Uint2Bytes(uint ipAddress) =>
    [
        (byte)(ipAddress >> 24),
        (byte)(ipAddress >> 16 & 255),
        (byte)(ipAddress >> 8 & 255),
        (byte)(ipAddress & 255)
    ];
}