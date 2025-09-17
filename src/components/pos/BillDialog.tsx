import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Customer, Product } from '@/data/mockData';
import { Receipt, Download, Mail } from 'lucide-react';
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
  paymentMethod: string;
}

export function BillDialog({ 
  open, 
  onOpenChange, 
  cart, 
  customer, 
  subtotal, 
  tax, 
  total, 
  paymentMethod 
}: BillDialogProps) {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  const billNumber = `BILL-${Date.now()}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bill - ${billNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .customer-info { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .totals { margin-left: auto; width: 300px; }
            .totals tr td { padding: 5px; }
            .total-row { font-weight: bold; border-top: 2px solid #000; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Fashion Boutique</h1>
            <p>Bill #: ${billNumber}</p>
            <p>Date: ${currentDate} ${currentTime}</p>
          </div>
          
          ${customer ? `
          <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${customer.firstName} ${customer.lastName}</p>
            <p><strong>Phone:</strong> ${customer.phone}</p>
            <p><strong>Address:</strong> ${customer.address}</p>
            <p><strong>Loyalty Points:</strong> ${customer.loyaltyPoints}</p>
          </div>
          ` : ''}
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${cart.map(item => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <table class="totals">
            <tr><td>Subtotal:</td><td>$${subtotal.toFixed(2)}</td></tr>
            <tr><td>Tax (8%):</td><td>$${tax.toFixed(2)}</td></tr>
            <tr class="total-row"><td>Total:</td><td>$${total.toFixed(2)}</td></tr>
            <tr><td>Payment Method:</td><td>${paymentMethod === 'credit_card' ? 'Credit Card' : 'Cash'}</td></tr>
          </table>
          
          <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>Visit us again soon!</p>
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
Fashion Boutique
================
Bill #: ${billNumber}
Date: ${currentDate} ${currentTime}

${customer ? `
Customer Information:
Name: ${customer.firstName} ${customer.lastName}
Phone: ${customer.phone}
Address: ${customer.address}
Loyalty Points: ${customer.loyaltyPoints}
` : ''}

Items:
${cart.map(item => `${item.product.name} x${item.quantity} @ $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Subtotal: $${subtotal.toFixed(2)}
Tax (8%): $${tax.toFixed(2)}
Total: $${total.toFixed(2)}
Payment Method: ${paymentMethod === 'credit_card' ? 'Credit Card' : 'Cash'}

Thank you for shopping with us!
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
      description: `Bill has been sent to ${customer.firstName} ${customer.lastName}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Bill Preview
          </DialogTitle>
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
                <p><span className="font-medium">Name:</span> {customer.firstName} {customer.lastName}</p>
                <p><span className="font-medium">Phone:</span> {customer.phone}</p>
                <p><span className="font-medium">Address:</span> {customer.address}</p>
                <p><span className="font-medium">Loyalty Points:</span> {customer.loyaltyPoints}</p>
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
                      <td className="text-right p-3">${item.price.toFixed(2)}</td>
                      <td className="text-right p-3">${(item.price * item.quantity).toFixed(2)}</td>
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
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (8%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Payment Method:</span>
              <span>{paymentMethod === 'credit_card' ? 'Credit Card' : 'Cash'}</span>
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
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}