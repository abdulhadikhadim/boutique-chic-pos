import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Customer, Product, apiClient, Sale } from '@/services/apiClient';
import { Receipt, Download, Mail, DollarSign, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CartItem {
  product: Product;
  variantId?: string;
  quantity: number;
  price: number;
}

interface BillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  customer: Customer | null;
  subtotal: number;
  tax: number;
  total: number;
  onSaleComplete: (saleData?: {
    paymentMethod: string;
    paidAmount: number;
    remainingAmount: number;
  }) => void;
  mode?: 'payment' | 'bill_only'; // New prop to control mode
}

export function BillDialog({ 
  open, 
  onOpenChange, 
  cart, 
  customer, 
  subtotal, 
  tax, 
  total, 
  onSaleComplete,
  mode = 'payment' // Default to payment mode
}: BillDialogProps) {
  const [paymentAmount, setPaymentAmount] = useState(total.toString());
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'debit_card' | 'mobile_payment'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  const billNumber = `BILL-${Date.now()}`;

  const paidAmount = parseFloat(paymentAmount) || 0;
  const remainingAmount = Math.max(0, total - paidAmount);
  const changeAmount = Math.max(0, paidAmount - total);

  const resetDialog = () => {
    setPaymentAmount(total.toString());
    setPaymentMethod('cash');
    setIsProcessing(false);
    setSaleCompleted(false);
    setCompletedSale(null);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const handleProcessPayment = async () => {
    if (paidAmount <= 0) {
      toast({
        title: "Invalid payment amount",
        description: "Please enter a valid payment amount",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare sale items
      const saleItems = cart.map(item => ({
        product_id: item.product.id,
        variant_id: item.variantId,
        quantity: item.quantity,
        price: item.price,
        product_name: item.product.name
      }));

      // Determine sale status based on payment amount
      const saleStatus = remainingAmount > 0 ? 'partial_payment' : 'completed';

      // Create sale object
      const saleData = {
        customer_id: customer?.id,
        items: saleItems,
        subtotal: subtotal,
        total: total,
        payment_method: paymentMethod,
        cashier_id: '1', // TODO: Get from current user context
        status: saleStatus,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount
      };

      // Process sale through API
      const response = await apiClient.createSale(saleData);
      setCompletedSale(response.data);
      setSaleCompleted(true);
      
      toast({
        title: "Payment processed!",
        description: remainingAmount > 0 
          ? `Partial payment of PKR ${paidAmount.toFixed(2)} received. Remaining: PKR ${remainingAmount.toFixed(2)}`
          : `Full payment of PKR ${paidAmount.toFixed(2)} received${changeAmount > 0 ? `. Change: PKR ${changeAmount.toFixed(2)}` : ''}`,
      });

      // Call the completion callback with payment data
      onSaleComplete({
        paymentMethod,
        paidAmount,
        remainingAmount
      });
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Determine if this is a bill-only generation or completed payment
      const isPaidBill = mode === 'payment' && saleCompleted;
      const isUnpaidBill = mode === 'bill_only';
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bill - ${billNumber}</title>
          <style>
            @media print {
              @page { margin: 0.5in; }
            }
            body { 
              font-family: 'Courier New', monospace; 
              margin: 0;
              padding: 20px;
              line-height: 1.4;
              color: #000;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 15px; 
              margin-bottom: 20px; 
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: bold;
            }
            .bill-info {
              text-align: center;
              margin-bottom: 20px;
              font-size: 12px;
            }
            .customer-info { 
              margin-bottom: 20px;
              border-bottom: 1px dashed #000;
              padding-bottom: 15px;
            }
            .customer-info h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
              font-weight: bold;
            }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
              border-bottom: 1px dashed #000;
            }
            .items-table th {
              border-bottom: 1px solid #000;
              padding: 8px 4px;
              text-align: left;
              font-weight: bold;
              font-size: 12px;
            }
            .items-table td {
              padding: 6px 4px;
              font-size: 11px;
              border-bottom: 1px dotted #ccc;
            }
            .items-table th:last-child,
            .items-table td:last-child {
              text-align: right;
            }
            .totals { 
              margin: 20px 0;
              font-size: 13px;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
            }
            .total-line {
              border-top: 1px solid #000;
              margin-top: 8px;
              padding-top: 8px;
              font-weight: bold;
              font-size: 15px;
            }
            .payment-section {
              margin-top: 20px;
              padding: 15px;
              border: 2px solid #000;
              background-color: ${isUnpaidBill ? '#fff8dc' : '#f9f9f9'};
            }
            .payment-section h3 {
              margin: 0 0 12px 0;
              font-size: 16px;
              text-align: center;
              font-weight: bold;
              text-transform: uppercase;
              color: ${isUnpaidBill ? '#d63384' : '#000'};
            }
            .payment-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              font-size: 14px;
              font-weight: bold;
            }
            .payment-status {
              text-align: center;
              margin-top: 15px;
              padding: 8px;
              border: ${isUnpaidBill ? '2px dashed #d63384' : '1px solid #000'};
              font-weight: bold;
              font-size: 14px;
              text-transform: uppercase;
            }
            .partial-payment {
              background-color: #fff3cd;
              color: #856404;
            }
            .full-payment {
              background-color: #d4edda;
              color: #155724;
            }
            .unpaid {
              background-color: #fff3cd;
              color: #856404;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              font-size: 12px;
              border-top: 1px dashed #000;
              padding-top: 15px;
            }
            .thank-you {
              font-weight: bold;
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Fashion Boutique</h1>
          </div>
          
          <div class="bill-info">
            <p><strong>Bill #:</strong> ${billNumber}</p>
            <p><strong>Date:</strong> ${currentDate} ${currentTime}</p>
          </div>
          
          ${customer ? `
          <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${customer.first_name} ${customer.last_name}</p>
            <p><strong>Phone:</strong> ${customer.phone}</p>
            ${customer.address ? `<p><strong>Address:</strong> ${customer.address}</p>` : ''}
            <p><strong>Loyalty Points:</strong> ${customer.loyalty_points}</p>
          </div>
          ` : ''}
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${cart.map(item => `
                <tr>
                  <td>${item.product.name}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">PKR ${item.price.toFixed(2)}</td>
                  <td style="text-align: right;">PKR ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>PKR ${subtotal.toFixed(2)}</span>
            </div>
            <div class="totals-row total-line">
              <span>TOTAL AMOUNT:</span>
              <span>PKR ${total.toFixed(2)}</span>
            </div>
          </div>

          <div class="payment-section">
            ${isUnpaidBill ? `
              <h3>⚠️ PAYMENT PENDING ⚠️</h3>
              <div class="payment-status unpaid">
                BILL GENERATED - PAYMENT REQUIRED
              </div>
              <div style="text-align: center; margin-top: 15px; font-size: 12px;">
                <p>Total Amount Due: <strong>PKR ${total.toFixed(2)}</strong></p>
                <p>Payment Method: <strong>To be collected</strong></p>
                <p>Status: <strong>UNPAID</strong></p>
              </div>
            ` : `
              <h3>Payment Details</h3>
              <div class="payment-row">
                <span>Payment Method:</span>
                <span>${paymentMethod === 'credit_card' ? 'Credit Card' : paymentMethod === 'debit_card' ? 'Debit Card' : paymentMethod === 'mobile_payment' ? 'Mobile Payment' : 'Cash'}</span>
              </div>
              <div class="payment-row">
                <span>Amount Paid:</span>
                <span>PKR ${paidAmount.toFixed(2)}</span>
              </div>
              ${remainingAmount > 0 ? `
              <div class="payment-row" style="color: #d63384;">
                <span>Remaining Balance:</span>
                <span>PKR ${remainingAmount.toFixed(2)}</span>
              </div>
              ` : ''}
              ${changeAmount > 0 ? `
              <div class="payment-row" style="color: #198754;">
                <span>Change Due:</span>
                <span>PKR ${changeAmount.toFixed(2)}</span>
              </div>
              ` : ''}
              
              <div class="payment-status ${remainingAmount > 0 ? 'partial-payment' : 'full-payment'}">
                ${remainingAmount > 0 ? 'PARTIAL PAYMENT - BALANCE DUE' : 'PAID IN FULL'}
              </div>
            `}
          </div>
          
          <div class="footer">
            <p class="thank-you">Thank you for shopping with us!</p>
            ${isUnpaidBill ? `
              <p>Please make payment to complete your purchase.</p>
              <p><strong>This bill is valid for payment collection.</strong></p>
            ` : `
              <p>Visit us again soon!</p>
              ${remainingAmount > 0 ? `<p><strong>Please keep this receipt for balance due: PKR ${remainingAmount.toFixed(2)}</strong></p>` : ''}
            `}
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const billContent = `
================================================
                FASHION BOUTIQUE
================================================
Bill #: ${billNumber}
Date: ${currentDate} ${currentTime}

${customer ? `CUSTOMER INFORMATION
----------------------------------------
Name: ${customer.first_name} ${customer.last_name}
Phone: ${customer.phone}
${customer.address ? `Address: ${customer.address}\n` : ''}Loyalty Points: ${customer.loyalty_points}

` : ''}
ITEMS PURCHASED
----------------------------------------
${cart.map(item => `${item.product.name}\n  Qty: ${item.quantity} x PKR ${item.price.toFixed(2)} = PKR ${(item.price * item.quantity).toFixed(2)}`).join('\n')}

----------------------------------------
SUBTOTAL:                    PKR ${subtotal.toFixed(2)}
----------------------------------------
TOTAL AMOUNT:                PKR ${total.toFixed(2)}

================================================
                PAYMENT DETAILS
================================================
Payment Method: ${paymentMethod === 'credit_card' ? 'Credit Card' : paymentMethod === 'debit_card' ? 'Debit Card' : paymentMethod === 'mobile_payment' ? 'Mobile Payment' : 'Cash'}
Amount Paid:                 PKR ${paidAmount.toFixed(2)}
${remainingAmount > 0 ? `Remaining Balance:           PKR ${remainingAmount.toFixed(2)}\n` : ''}${changeAmount > 0 ? `Change Due:                  PKR ${changeAmount.toFixed(2)}\n` : ''}
Status: ${remainingAmount > 0 ? 'PARTIAL PAYMENT - BALANCE DUE' : 'PAID IN FULL'}

${remainingAmount > 0 ? `⚠️  IMPORTANT: Balance of PKR ${remainingAmount.toFixed(2)} is still due.\nPlease keep this receipt for your records.\n\n` : ''}Thank you for shopping with us!
Visit us again soon!
================================================
    `;

    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-${billNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    if (!customer) {
      toast({
        title: "No customer selected",
        description: "Please select a customer to email the bill",
        variant: "destructive"
      });
      return;
    }

    // Simulate email sending
    toast({
      title: "Email sent!",
      description: `Bill has been sent to ${customer.first_name} ${customer.last_name}`,
    });
  };

  if (!saleCompleted) {
    return (
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Receipt className="w-5 h-5 mr-2" />
              {mode === 'bill_only' ? 'Generate Bill' : 'Process Payment'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'bill_only' 
                ? 'Generate and print bill for this order. Payment can be collected later.'
                : 'Complete the payment process for this order'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold">Fashion Boutique</h2>
              <p className="text-sm text-muted-foreground">Bill #: {billNumber}</p>
              <p className="text-sm text-muted-foreground">{currentDate} {currentTime}</p>
            </div>

            {/* Customer Info */}
            {customer && (
              <div className="space-y-2">
                <h3 className="font-semibold">Customer Information</h3>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Name:</span> {customer.first_name} {customer.last_name}</p>
                  <p><span className="font-medium">Phone:</span> {customer.phone}</p>
                  {customer.address && <p><span className="font-medium">Address:</span> {customer.address}</p>}
                  <p><span className="font-medium">Loyalty Points:</span> {customer.loyalty_points}</p>
                </div>
              </div>
            )}

            {/* Items Summary */}
            <div className="space-y-2">
              <h3 className="font-semibold">Items ({cart.length})</h3>
              <div className="max-h-32 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">Item</th>
                      <th className="text-center p-2">Qty</th>
                      <th className="text-right p-2">Price</th>
                      <th className="text-right p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{item.product.name}</td>
                        <td className="text-center p-2">{item.quantity}</td>
                        <td className="text-right p-2">${item.price.toFixed(2)}</td>
                        <td className="text-right p-2">${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>PKR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>PKR {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Section - Only show for payment mode */}
            {mode === 'payment' && (
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="font-semibold">Payment Details</h3>
              
              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('cash')}
                    className="justify-start"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Cash
                  </Button>
                  <Button
                    variant={paymentMethod === 'credit_card' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('credit_card')}
                    className="justify-start"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Credit Card
                  </Button>
                  <Button
                    variant={paymentMethod === 'debit_card' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('debit_card')}
                    className="justify-start"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Debit Card
                  </Button>
                  <Button
                    variant={paymentMethod === 'mobile_payment' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('mobile_payment')}
                    className="justify-start"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Mobile Payment
                  </Button>
                </div>
              </div>

              {/* Payment Amount */}
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Payment Amount</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={total * 2} // Allow up to 2x total for change scenarios
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setPaymentAmount(total.toString())}
                    className="h-6 px-2"
                  >
                    Exact Amount
                  </Button>
                  {paymentMethod === 'cash' && (
                    <div className="space-x-1">
                      {[5, 10, 20, 50, 100].map((amount) => (
                        <Button
                          key={amount}
                          variant="ghost"
                          size="sm"
                          onClick={() => setPaymentAmount((Math.ceil(total / amount) * amount).toString())}
                          className="h-6 px-2 text-xs"
                        >
                          PKR {amount}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              {paidAmount > 0 && (
                <div className="space-y-2 bg-muted/50 p-3 rounded">
                  <div className="flex justify-between text-sm">
                    <span>Amount Paying:</span>
                    <span className="font-medium">PKR {paidAmount.toFixed(2)}</span>
                  </div>
                  {remainingAmount > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Remaining Balance:</span>
                      <span className="font-medium">PKR {remainingAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {changeAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Change Due:</span>
                      <span className="font-medium">PKR {changeAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Bill Only Mode - Show special message */}
            {mode === 'bill_only' && (
              <div className="space-y-2 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <h3 className="font-semibold text-yellow-800">Bill Generation Mode</h3>
                </div>
                <p className="text-sm text-yellow-700">
                  This will generate a bill for the customer without processing payment. 
                  Payment can be collected later when the customer is ready.
                </p>
                <div className="text-sm text-yellow-800 font-medium">
                  Total Amount Due: PKR {total.toFixed(2)}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => handleDialogClose(false)}>
                Cancel
              </Button>
              {mode === 'bill_only' ? (
                <Button onClick={handlePrint}>
                  <Receipt className="w-4 h-4 mr-2" />
                  Generate & Print Bill
                </Button>
              ) : (
                <Button 
                  onClick={handleProcessPayment}
                  disabled={isProcessing || paidAmount <= 0}
                  className="min-w-32"
                >
                  {isProcessing ? 'Processing...' : remainingAmount > 0 ? 'Partial Payment' : 'Complete Payment'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Sale completed view
  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Payment Receipt
          </DialogTitle>
          <DialogDescription>
            Transaction completed successfully - download or print receipt
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h2 className="text-2xl font-bold">Fashion Boutique</h2>
            <p className="text-sm text-muted-foreground">Bill #: {billNumber}</p>
            <p className="text-sm text-muted-foreground">{currentDate} {currentTime}</p>
            <div className="mt-2">
              {remainingAmount > 0 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Partially Paid
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Paid in Full
                </span>
              )}
            </div>
          </div>

          {/* Customer Info */}
          {customer && (
            <div className="space-y-2">
              <h3 className="font-semibold">Customer Information</h3>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Name:</span> {customer.first_name} {customer.last_name}</p>
                <p><span className="font-medium">Phone:</span> {customer.phone}</p>
                {customer.address && <p><span className="font-medium">Address:</span> {customer.address}</p>}
                <p><span className="font-medium">Loyalty Points:</span> {customer.loyalty_points}</p>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="space-y-2">
            <h3 className="font-semibold">Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Item</th>
                    <th className="text-center p-3">Qty</th>
                    <th className="text-right p-3">Price</th>
                    <th className="text-right p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.product.name}</td>
                      <td className="text-center p-3">{item.quantity}</td>
                      <td className="text-right p-3">PKR {item.price.toFixed(2)}</td>
                      <td className="text-right p-3">PKR {(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>PKR {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>PKR {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold">Payment Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span>{paymentMethod === 'credit_card' ? 'Credit Card' : paymentMethod === 'debit_card' ? 'Debit Card' : paymentMethod === 'mobile_payment' ? 'Mobile Payment' : 'Cash'}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-medium">PKR {paidAmount.toFixed(2)}</span>
              </div>
              {remainingAmount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Remaining Balance:</span>
                  <span className="font-medium">PKR {remainingAmount.toFixed(2)}</span>
                </div>
              )}
              {changeAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Change Due:</span>
                  <span className="font-medium">PKR {changeAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handleEmail}>
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button onClick={handlePrint}>
              <Receipt className="w-4 h-4 mr-2" />
              Print Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}