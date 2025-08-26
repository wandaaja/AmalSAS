package midtrans

import (
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
