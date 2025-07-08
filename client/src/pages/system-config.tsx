import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Plus, Edit, Trash, Eye, EyeOff, Upload, Download, Settings,
  Table as TabsIcon, Clock, CheckCircle, AlertCircle
} from "lucide-react";

interface SystemTab {
  id: number;
  name: string;
  path: string;
  icon?: string;
  isActive: boolean;
  order: number;
  requiredPermissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface SystemUpdate {
  id: number;
  version: string;
  description?: string;
  changelog?: string;
  isDeployed: boolean;
  deployedAt?: string;
  createdAt: string;
}

export default function SystemConfig() {
  const { toast } = useToast();
  const [tabs, setTabs] = useState<SystemTab[]>([]);
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newTab, setNewTab] = useState({
    name: "",
    path: "",
    icon: "",
    order: 0,
    requiredPermissions: [] as string[]
  });
  
  const [newUpdate, setNewUpdate] = useState({
    version: "",
    description: "",
    changelog: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("superAdminToken");
      
      const [tabsResponse, updatesResponse] = await Promise.all([
        fetch("/api/super-admin/system-tabs", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/super-admin/system-updates", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (tabsResponse.ok && updatesResponse.ok) {
        const tabsData = await tabsResponse.json();
        const updatesData = await updatesResponse.json();
        setTabs(tabsData);
        setUpdates(updatesData);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTab = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("superAdminToken");
      const response = await fetch("/api/super-admin/system-tabs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newTab)
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Onglet créé avec succès"
        });
        setNewTab({ name: "", path: "", icon: "", order: 0, requiredPermissions: [] });
        loadData();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'onglet",
        variant: "destructive"
      });
    }
  };

  const handleToggleTab = async (id: number) => {
    try {
      const token = localStorage.getItem("superAdminToken");
      const response = await fetch(`/api/super-admin/system-tabs/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        loadData();
        toast({
          title: "Succès",
          description: "Statut de l'onglet modifié"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTab = async (id: number) => {
    try {
      const token = localStorage.getItem("superAdminToken");
      const response = await fetch(`/api/super-admin/system-tabs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        loadData();
        toast({
          title: "Succès",
          description: "Onglet supprimé avec succès"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("superAdminToken");
      const response = await fetch("/api/super-admin/system-updates", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newUpdate)
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Mise à jour créée avec succès"
        });
        setNewUpdate({ version: "", description: "", changelog: "" });
        loadData();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la mise à jour",
        variant: "destructive"
      });
    }
  };

  const handleDeployUpdate = async (id: number) => {
    try {
      const token = localStorage.getItem("superAdminToken");
      const response = await fetch(`/api/super-admin/system-updates/${id}/deploy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        loadData();
        toast({
          title: "Succès",
          description: "Mise à jour déployée avec succès"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du déploiement",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="mx-auto h-12 w-12 animate-spin text-red-600 mb-4" />
          <p className="text-lg">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-red-600">Configuration Système</h1>
          <p className="text-gray-600">Gérez les onglets et mises à jour du système</p>
        </div>
      </div>

      <Tabs defaultValue="tabs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tabs" className="flex items-center gap-2">
            <TabsIcon className="h-4 w-4" />
            Onglets Système
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Mises à jour
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tabs" className="space-y-6">
          {/* Création d'onglet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Créer un nouvel onglet
              </CardTitle>
              <CardDescription>
                Ajouter un nouvel onglet au système de navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTab} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom de l'onglet</Label>
                    <Input
                      id="name"
                      value={newTab.name}
                      onChange={(e) => setNewTab({ ...newTab, name: e.target.value })}
                      placeholder="Ex: Inventaire"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="path">Chemin</Label>
                    <Input
                      id="path"
                      value={newTab.path}
                      onChange={(e) => setNewTab({ ...newTab, path: e.target.value })}
                      placeholder="Ex: /inventory"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="icon">Icône (optionnel)</Label>
                    <Input
                      id="icon"
                      value={newTab.icon}
                      onChange={(e) => setNewTab({ ...newTab, icon: e.target.value })}
                      placeholder="Ex: Package"
                    />
                  </div>
                  <div>
                    <Label htmlFor="order">Ordre d'affichage</Label>
                    <Input
                      id="order"
                      type="number"
                      value={newTab.order}
                      onChange={(e) => setNewTab({ ...newTab, order: parseInt(e.target.value) })}
                      min="0"
                    />
                  </div>
                </div>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer l'onglet
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Liste des onglets */}
          <Card>
            <CardHeader>
              <CardTitle>Onglets existants</CardTitle>
              <CardDescription>
                Gérez les onglets de navigation du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tabs.map((tab) => (
                  <div key={tab.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {tab.isActive ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="font-medium">{tab.name}</span>
                      </div>
                      <Badge variant="outline">{tab.path}</Badge>
                      <span className="text-sm text-gray-500">Ordre: {tab.order}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={tab.isActive}
                        onCheckedChange={() => handleToggleTab(tab.id)}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer l'onglet</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer l'onglet "{tab.name}" ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTab(tab.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                {tabs.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Aucun onglet configuré</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-6">
          {/* Création de mise à jour */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Créer une nouvelle mise à jour
              </CardTitle>
              <CardDescription>
                Préparer une mise à jour système pour déploiement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={newUpdate.version}
                    onChange={(e) => setNewUpdate({ ...newUpdate, version: e.target.value })}
                    placeholder="Ex: v1.2.0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newUpdate.description}
                    onChange={(e) => setNewUpdate({ ...newUpdate, description: e.target.value })}
                    placeholder="Description courte de la mise à jour"
                  />
                </div>
                <div>
                  <Label htmlFor="changelog">Notes de version</Label>
                  <Textarea
                    id="changelog"
                    value={newUpdate.changelog}
                    onChange={(e) => setNewUpdate({ ...newUpdate, changelog: e.target.value })}
                    placeholder="Détails des changements apportés..."
                    rows={4}
                  />
                </div>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer la mise à jour
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Liste des mises à jour */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des mises à jour</CardTitle>
              <CardDescription>
                Gérez et déployez les mises à jour système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updates.map((update) => (
                  <div key={update.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={update.isDeployed ? "default" : "secondary"}>
                          {update.version}
                        </Badge>
                        {update.isDeployed ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Déployé</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-orange-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">En attente</span>
                          </div>
                        )}
                      </div>
                      {update.description && (
                        <p className="text-sm text-gray-600">{update.description}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        Créé le {new Date(update.createdAt).toLocaleDateString()}
                        {update.deployedAt && (
                          <span> • Déployé le {new Date(update.deployedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!update.isDeployed && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-700" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Déployer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Déployer la mise à jour</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir déployer la version {update.version} ? Cette action ne peut pas être annulée.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeployUpdate(update.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Déployer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))}
                {updates.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Aucune mise à jour créée</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}