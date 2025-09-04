package midtrans

import (
	"fmt"
	"os"

	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/coreapi"
	"github.com/midtrans/midtrans-go/snap"
)

var (
	SnapClient snap.Client
	CoreClient coreapi.Client
)

func Init() {
	// Ambil key dari environment variable
	serverKey := os.Getenv("MIDTRANS_SERVER_KEY")
	clientKey := os.Getenv("MIDTRANS_CLIENT_KEY")

	fmt.Println("🔑 Midtrans Server Key:", serverKey[:10]+"...")
	fmt.Println("🔑 Midtrans Client Key:", clientKey[:10]+"...")
	fmt.Println("🌍 Midtrans Environment: Sandbox")

	// Setup Midtrans config global
	midtrans.ServerKey = serverKey
	midtrans.ClientKey = clientKey
	midtrans.Environment = midtrans.Sandbox

	// Inisialisasi Snap Client
	SnapClient = snap.Client{}
	SnapClient.New(serverKey, midtrans.Environment)

	// Inisialisasi Core API Client
	CoreClient = coreapi.Client{}
	CoreClient.New(serverKey, midtrans.Environment)
}
