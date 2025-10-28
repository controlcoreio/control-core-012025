import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, Eye, EyeOff, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

interface AttributeMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mappings: any[]) => void;
  connectionId: string;
  connectionName: string;
  existingMappings?: any[];
}

export default function AttributeMappingModal({ 
  isOpen, 
  onClose, 
  onSave, 
  connectionId, 
  connectionName,
  existingMappings = []
}: AttributeMappingModalProps) {
  const [mappings, setMappings] = useState(existingMappings);
  const [newMapping, setNewMapping] = useState({
    source_attribute: "",
    target_attribute: "",
    transformation_rule: { type: "direct" },
    is_required: false,
    is_sensitive: false,
    data_type: "string",
    validation_rules: []
  });
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState("mappings");

  const dataTypes = [
    { value: "string", label: "String", description: "Text data" },
    { value: "number", label: "Number", description: "Numeric data" },
    { value: "boolean", label: "Boolean", label: "True/False values" },
    { value: "array", label: "Array", description: "List of values" },
    { value: "object", label: "Object", description: "Complex data structure" },
    { value: "datetime", label: "DateTime", description: "Date and time values" }
  ];

  const transformationRules = [
    { value: "direct", label: "Direct Mapping", description: "Map value directly" },
    { value: "uppercase", label: "Uppercase", description: "Convert to uppercase" },
    { value: "lowercase", label: "Lowercase", description: "Convert to lowercase" },
    { value: "trim", label: "Trim", description: "Remove whitespace" },
    { value: "format", label: "Format", description: "Apply custom format" },
    { value: "extract", label: "Extract", description: "Extract from nested object" },
    { value: "concat", label: "Concatenate", description: "Join multiple values" },
    { value: "split", label: "Split", description: "Split string into array" },
    { value: "replace", label: "Replace", description: "Replace text patterns" },
    { value: "custom", label: "Custom", description: "Custom transformation logic" }
  ];

  const handleAddMapping = () => {
    if (newMapping.source_attribute && newMapping.target_attribute) {
      const mapping = {
        id: Date.now().toString(),
        ...newMapping,
        connection_id: connectionId
      };
      setMappings([...mappings, mapping]);
      setNewMapping({
        source_attribute: "",
        target_attribute: "",
        transformation_rule: { type: "direct" },
        is_required: false,
        is_sensitive: false,
        data_type: "string",
        validation_rules: []
      });
      setIsAdding(false);
    }
  };

  const handleRemoveMapping = (id: string) => {
    setMappings(mappings.filter(m => m.id !== id));
  };

  const handleSave = () => {
    onSave(mappings);
    onClose();
  };

  const getTransformationIcon = (type: string) => {
    switch (type) {
      case "direct":
        return <ArrowRight className="h-4 w-4" />;
      case "uppercase":
      case "lowercase":
        return <Edit className="h-4 w-4" />;
      case "trim":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Edit className="h-4 w-4" />;
    }
  };

  const getDataTypeColor = (type: string) => {
    const colors = {
      string: "bg-blue-100 text-blue-800",
      number: "bg-green-100 text-green-800",
      boolean: "bg-purple-100 text-purple-800",
      array: "bg-orange-100 text-orange-800",
      object: "bg-pink-100 text-pink-800",
      datetime: "bg-indigo-100 text-indigo-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attribute Mappings</DialogTitle>
          <DialogDescription>
            Configure how attributes from {connectionName} map to Control Core attributes
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="mappings">Current Mappings</TabsTrigger>
            <TabsTrigger value="add">Add Mapping</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="mappings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attribute Mappings</CardTitle>
                <CardDescription>
                  {mappings.length} mapping{mappings.length !== 1 ? 's' : ''} configured
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mappings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No attribute mappings configured</p>
                    <p className="text-sm">Add mappings to connect external attributes to Control Core</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source Attribute</TableHead>
                        <TableHead>Target Attribute</TableHead>
                        <TableHead>Transformation</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Sensitive</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappings.map((mapping) => (
                        <TableRow key={mapping.id}>
                          <TableCell className="font-mono text-sm">
                            {mapping.source_attribute}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {mapping.target_attribute}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTransformationIcon(mapping.transformation_rule.type)}
                              <span className="text-sm capitalize">
                                {mapping.transformation_rule.type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getDataTypeColor(mapping.data_type)}>
                              {mapping.data_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {mapping.is_required ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell>
                            {mapping.is_sensitive ? (
                              <EyeOff className="h-4 w-4 text-red-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveMapping(mapping.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Mapping</CardTitle>
                <CardDescription>
                  Create a new attribute mapping for this connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source_attribute">Source Attribute</Label>
                    <Input
                      id="source_attribute"
                      value={newMapping.source_attribute}
                      onChange={(e) => setNewMapping(prev => ({ 
                        ...prev, 
                        source_attribute: e.target.value 
                      }))}
                      placeholder="user.email"
                    />
                    <p className="text-sm text-muted-foreground">
                      The attribute name from the external system
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_attribute">Target Attribute</Label>
                    <Input
                      id="target_attribute"
                      value={newMapping.target_attribute}
                      onChange={(e) => setNewMapping(prev => ({ 
                        ...prev, 
                        target_attribute: e.target.value 
                      }))}
                      placeholder="controlcore.user.email"
                    />
                    <p className="text-sm text-muted-foreground">
                      The attribute name in Control Core
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Transformation Rule</Label>
                    <Select 
                      value={newMapping.transformation_rule.type} 
                      onValueChange={(value) => setNewMapping(prev => ({ 
                        ...prev, 
                        transformation_rule: { type: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transformationRules.map((rule) => (
                          <SelectItem key={rule.value} value={rule.value}>
                            <div className="flex items-center gap-2">
                              {getTransformationIcon(rule.value)}
                              <div>
                                <div className="font-medium">{rule.label}</div>
                                <div className="text-sm text-muted-foreground">{rule.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Type</Label>
                    <Select 
                      value={newMapping.data_type} 
                      onValueChange={(value) => setNewMapping(prev => ({ 
                        ...prev, 
                        data_type: value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dataTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_required">Required</Label>
                      <p className="text-sm text-muted-foreground">
                        This attribute is required for policy evaluation
                      </p>
                    </div>
                    <Switch
                      id="is_required"
                      checked={newMapping.is_required}
                      onCheckedChange={(checked) => setNewMapping(prev => ({ 
                        ...prev, 
                        is_required: checked 
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_sensitive">Sensitive</Label>
                      <p className="text-sm text-muted-foreground">
                        This attribute contains sensitive data
                      </p>
                    </div>
                    <Switch
                      id="is_sensitive"
                      checked={newMapping.is_sensitive}
                      onCheckedChange={(checked) => setNewMapping(prev => ({ 
                        ...prev, 
                        is_sensitive: checked 
                      }))}
                    />
                  </div>
                </div>

                {newMapping.transformation_rule.type === "custom" && (
                  <div className="space-y-2">
                    <Label>Custom Transformation Logic</Label>
                    <Textarea
                      placeholder="// Custom JavaScript transformation logic&#10;return value.toUpperCase();"
                      className="min-h-[100px] font-mono text-sm"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleAddMapping}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Mapping
                  </Button>
                  <Button variant="outline" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mapping Preview</CardTitle>
                <CardDescription>
                  Preview how data will be transformed and mapped
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Source Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm bg-gray-50 p-3 rounded">
{`{
  "user": {
    "email": "john@example.com",
    "name": "John Doe",
    "roles": ["admin", "user"]
  }
}`}
                        </pre>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Transformed Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm bg-gray-50 p-3 rounded">
{`{
  "controlcore": {
    "user": {
      "email": "john@example.com",
      "name": "John Doe",
      "roles": ["admin", "user"]
    }
  }
}`}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Mappings ({mappings.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
