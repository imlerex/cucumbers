package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"
)

// OrderItem represents a single item inside an order
type OrderItem struct {
	ID    int     `json:"id"`
	Name  string  `json:"name"`
	Qty   int     `json:"qty"`
	Price float64 `json:"price"`
}

// OrderPayload represents incoming order data
type OrderPayload struct {
	OrderID      string      `json:"order_id,omitempty"`
	Name         string      `json:"name"`
	Phone        string      `json:"phone"`
	Address      string      `json:"address"`
	DeliveryType string      `json:"deliveryType"`
	Comment      string      `json:"comment"`
	Items        []OrderItem `json:"items"`
	Total        float64     `json:"total"`
	Timestamp    string      `json:"timestamp"`
}

var (
	ordersFile = "orders.json"
	ordersMu   sync.Mutex
	startTime  = time.Now()
)

func main() {
	portFlag := flag.String("port", "8080", "Port to listen on")
	dirFlag := flag.String("dir", ".", "Directory of static website files")
	flag.Parse()

	port := os.Getenv("PORT")
	if port == "" {
		port = *portFlag
	}

	mux := http.NewServeMux()

	// 1. Health check endpoint
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "ok",
			"uptime":  time.Since(startTime).String(),
			"store":   "ЦАРЬ-ОГУРЕЦ",
			"version": "2.0.0",
		})
	})

	// 2. Order submission API endpoint
	mux.HandleFunc("/api/order", handleOrder)

	// 3. Static files handler with MIME types and CORS
	fs := http.FileServer(http.Dir(*dirFlag))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Log request
		log.Printf("[%s] %s %s", r.Method, r.RemoteAddr, r.URL.Path)

		// Set custom headers for web assets
		path := r.URL.Path
		if strings.HasSuffix(path, ".css") {
			w.Header().Set("Content-Type", "text/css; charset=utf-8")
		} else if strings.HasSuffix(path, ".js") {
			w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		} else if strings.HasSuffix(path, ".html") || path == "/" {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
		}

		// Security & cache control
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		fs.ServeHTTP(w, r)
	})

	addr := ":" + port
	server := &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Print fancy banner
	printBanner(port, *dirFlag)

	// Graceful shutdown channel
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	<-stop
	fmt.Println("\n🥒 [ЦАРЬ-ОГУРЕЦ] Сервер аккуратно останавливается... До встречи!")
}

func handleOrder(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var order OrderPayload
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		http.Error(w, `{"error":"Invalid JSON payload"}`, http.StatusBadRequest)
		return
	}

	// Generate Order ID
	order.OrderID = fmt.Sprintf("OGUR-%s-%04d", time.Now().Format("20060102"), time.Now().UnixNano()%10000)
	if order.Timestamp == "" {
		order.Timestamp = time.Now().Format(time.RFC3339)
	}

	// Persist order to orders.json
	ordersMu.Lock()
	defer ordersMu.Unlock()

	var existingOrders []OrderPayload
	if data, err := os.ReadFile(ordersFile); err == nil {
		_ = json.Unmarshal(data, &existingOrders)
	}
	existingOrders = append(existingOrders, order)

	if encoded, err := json.MarshalIndent(existingOrders, "", "  "); err == nil {
		_ = os.WriteFile(ordersFile, encoded, 0644)
	}

	log.Printf("🎉 Новый заказ принят! ID: %s | Клиент: %s | Сумма: %.2f BYN", order.OrderID, order.Name, order.Total)

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":   "ok",
		"order_id": order.OrderID,
		"message":  "Заказ успешно сохранён в системе Царь-Огурец!",
	})
}

func printBanner(port, dir string) {
	absDir, _ := filepath.Abs(dir)
	banner := `
======================================================================
  🥒🥒🥒   Ц А Р Ь - О Г У Р Е Ц  ·  D E L U X E  S E R V E R   🥒🥒🥒
======================================================================
  🌐 Local URL:       http://localhost:%s
  📁 Static Dir:      %s
  🚀 API Order:       http://localhost:%s/api/order
  💚 Health Check:    http://localhost:%s/api/health
  ⚡ GitHub Pages:    Ready! (index.html at repository root)
======================================================================
  Нажмите Ctrl+C для остановки сервера
`
	fmt.Printf(banner, port, absDir, port, port)
}
