import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, UserPlus, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

interface ContactManagerProps {
  onContactsChange: (contacts: Contact[]) => void;
}

export const ContactManager = ({ onContactsChange }: ContactManagerProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    relationship: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    const savedContacts = localStorage.getItem('emergency_contacts');
    if (savedContacts) {
      const parsed = JSON.parse(savedContacts);
      setContacts(parsed);
      onContactsChange(parsed);
    }
  }, [onContactsChange]);

  const saveContacts = (updatedContacts: Contact[]) => {
    setContacts(updatedContacts);
    localStorage.setItem('emergency_contacts', JSON.stringify(updatedContacts));
    onContactsChange(updatedContacts);
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phone) {
      toast({
        title: "Missing Information",
        description: "Please provide at least name and phone number.",
        variant: "destructive",
      });
      return;
    }

    const contact: Contact = {
      id: Date.now().toString(),
      ...newContact
    };

    const updatedContacts = [...contacts, contact];
    saveContacts(updatedContacts);
    
    setNewContact({ name: "", phone: "", email: "", relationship: "" });
    setShowAddForm(false);
    
    toast({
      title: "Contact Added",
      description: `${contact.name} has been added to your emergency contacts.`,
    });
  };

  const removeContact = (id: string) => {
    const updatedContacts = contacts.filter(c => c.id !== id);
    saveContacts(updatedContacts);
    
    toast({
      title: "Contact Removed",
      description: "Emergency contact has been removed.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emergency to-accent bg-clip-text text-transparent">
          Emergency Contacts
        </h2>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="outline"
          size="sm"
          className="border-emergency/30 hover:bg-emergency/10"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-emergency/20 bg-gradient-to-br from-card to-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <UserPlus className="w-5 h-5 mr-2 text-emergency" />
              Add Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Full Name"
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                className="border-emergency/20 focus:border-emergency"
              />
              <Input
                placeholder="Relationship"
                value={newContact.relationship}
                onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                className="border-emergency/20 focus:border-emergency"
              />
            </div>
            <Input
              placeholder="Phone Number"
              type="tel"
              value={newContact.phone}
              onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
              className="border-emergency/20 focus:border-emergency"
            />
            <Input
              placeholder="Email (Optional)"
              type="email"
              value={newContact.email}
              onChange={(e) => setNewContact({...newContact, email: e.target.value})}
              className="border-emergency/20 focus:border-emergency"
            />
            <div className="flex gap-2">
              <Button onClick={addContact} className="flex-1 bg-gradient-to-r from-emergency to-accent">
                Save Contact
              </Button>
              <Button onClick={() => setShowAddForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {contacts.length === 0 ? (
          <Card className="border-emergency/20 bg-gradient-to-br from-card to-muted/30">
            <CardContent className="text-center py-12">
              <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No emergency contacts added yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add contacts who should be notified in case of emergency.
              </p>
            </CardContent>
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} className="border-emergency/20 bg-gradient-to-br from-card to-muted/30 hover:border-emergency/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{contact.name}</h3>
                      {contact.relationship && (
                        <Badge variant="outline" className="border-emergency/30 text-emergency">
                          {contact.relationship}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {contact.phone}
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {contact.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => removeContact(contact.id)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {contacts.length > 0 && (
        <div className="text-center">
          <Badge variant="outline" className="border-safe/50 text-safe">
            {contacts.length} Emergency Contact{contacts.length !== 1 ? 's' : ''} Configured
          </Badge>
        </div>
      )}
    </div>
  );
};