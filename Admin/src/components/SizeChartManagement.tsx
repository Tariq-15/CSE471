import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Plus, Edit, Trash2, Loader2, Grid3X3, Save, X, Ruler } from "lucide-react";
import {
  getSizeChartTemplates,
  getSizeChartTemplate,
  createSizeChartTemplate,
  updateSizeChartTemplate,
  deleteSizeChartTemplate,
  addSizeChartRow,
  addSizeChartColumn,
  updateSizeChartValues,
  deleteSizeChartRow,
  deleteSizeChartColumn,
  type SizeChartTemplate,
  type SizeChartRow,
  type SizeChartColumn,
} from "@/lib/api";

export function SizeChartManagement() {
  const [templates, setTemplates] = useState<SizeChartTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SizeChartTemplate | null>(null);
  
  // Form states
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit mode states
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [newRowLabel, setNewRowLabel] = useState("");
  const [newColumnKey, setNewColumnKey] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnUnit, setNewColumnUnit] = useState("cm");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSizeChartTemplates();
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        setError(response.error || 'Failed to fetch templates');
      }
    } catch (err) {
      setError('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;
    
    try {
      setIsSubmitting(true);
      const response = await createSizeChartTemplate({
        name: newTemplateName,
        description: newTemplateDescription
      });
      
      if (response.success) {
        setNewTemplateName("");
        setNewTemplateDescription("");
        setIsCreateDialogOpen(false);
        fetchTemplates();
      } else {
        alert(response.error || 'Failed to create template');
      }
    } catch (err) {
      alert('Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = async (template: SizeChartTemplate) => {
    try {
      setLoading(true);
      const response = await getSizeChartTemplate(template.id);
      if (response.success && response.data) {
        setSelectedTemplate(response.data);
        
        // Initialize edit values from values_grid
        const values: Record<string, string> = {};
        if (response.data.values_grid) {
          for (const [rowLabel, cols] of Object.entries(response.data.values_grid)) {
            for (const [colKey, value] of Object.entries(cols as Record<string, string>)) {
              values[`${rowLabel}_${colKey}`] = value;
            }
          }
        }
        setEditValues(values);
        setIsEditDialogOpen(true);
      }
    } catch (err) {
      alert('Failed to load template details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await deleteSizeChartTemplate(templateId);
      if (response.success) {
        fetchTemplates();
      } else {
        alert(response.error || 'Failed to delete template');
      }
    } catch (err) {
      alert('Failed to delete template');
    }
  };

  const handleAddRow = async () => {
    if (!selectedTemplate || !newRowLabel.trim()) return;
    
    try {
      setIsSubmitting(true);
      const response = await addSizeChartRow(selectedTemplate.id, {
        size_label: newRowLabel,
        sort_order: (selectedTemplate.rows?.length || 0)
      });
      
      if (response.success) {
        setNewRowLabel("");
        // Refresh template
        const refreshed = await getSizeChartTemplate(selectedTemplate.id);
        if (refreshed.success && refreshed.data) {
          setSelectedTemplate(refreshed.data);
        }
      }
    } catch (err) {
      alert('Failed to add row');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddColumn = async () => {
    if (!selectedTemplate || !newColumnKey.trim() || !newColumnName.trim()) return;
    
    try {
      setIsSubmitting(true);
      const response = await addSizeChartColumn(selectedTemplate.id, {
        column_key: newColumnKey.toLowerCase().replace(/\s+/g, '_'),
        display_name: newColumnName,
        unit: newColumnUnit,
        sort_order: (selectedTemplate.columns?.length || 0)
      });
      
      if (response.success) {
        setNewColumnKey("");
        setNewColumnName("");
        setNewColumnUnit("cm");
        // Refresh template
        const refreshed = await getSizeChartTemplate(selectedTemplate.id);
        if (refreshed.success && refreshed.data) {
          setSelectedTemplate(refreshed.data);
        }
      }
    } catch (err) {
      alert('Failed to add column');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRow = async (rowId: number) => {
    if (!selectedTemplate) return;
    
    try {
      const response = await deleteSizeChartRow(selectedTemplate.id, rowId);
      if (response.success) {
        const refreshed = await getSizeChartTemplate(selectedTemplate.id);
        if (refreshed.success && refreshed.data) {
          setSelectedTemplate(refreshed.data);
        }
      }
    } catch (err) {
      alert('Failed to delete row');
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    if (!selectedTemplate) return;
    
    try {
      const response = await deleteSizeChartColumn(selectedTemplate.id, columnId);
      if (response.success) {
        const refreshed = await getSizeChartTemplate(selectedTemplate.id);
        if (refreshed.success && refreshed.data) {
          setSelectedTemplate(refreshed.data);
        }
      }
    } catch (err) {
      alert('Failed to delete column');
    }
  };

  const handleSaveValues = async () => {
    if (!selectedTemplate) return;
    
    try {
      setIsSubmitting(true);
      
      // Convert editValues to API format
      const values: { row_id: number; column_id: number; value: string }[] = [];
      
      for (const row of selectedTemplate.rows || []) {
        for (const col of selectedTemplate.columns || []) {
          const key = `${row.size_label}_${col.column_key}`;
          const value = editValues[key] || '';
          values.push({
            row_id: row.id,
            column_id: col.id,
            value
          });
        }
      }
      
      const response = await updateSizeChartValues(selectedTemplate.id, values);
      
      if (response.success) {
        alert('Values saved successfully!');
        // Refresh
        const refreshed = await getSizeChartTemplate(selectedTemplate.id);
        if (refreshed.success && refreshed.data) {
          setSelectedTemplate(refreshed.data);
        }
      } else {
        alert(response.error || 'Failed to save values');
      }
    } catch (err) {
      alert('Failed to save values');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading && templates.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#576D64]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full max-w-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-black">Size Chart Management</h2>
          <p className="text-gray-500 text-sm mt-1">Create and manage size chart templates for your products</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#576D64] hover:bg-[#465A52] text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Size Chart Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Men's T-Shirt Sizes"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Brief description of this size chart"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTemplate}
                disabled={!newTemplateName.trim() || isSubmitting}
                className="bg-[#576D64] hover:bg-[#465A52]"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchTemplates} className="mt-2" size="sm">Retry</Button>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.description && (
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  )}
                </div>
                <Badge variant="secondary" className="bg-[#576D64]/10 text-[#576D64]">
                  <Grid3X3 className="w-3 h-3 mr-1" />
                  Chart
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500 mb-4">
                Created: {formatDate(template.created_at)}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleOpenEdit(template)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {templates.length === 0 && !loading && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Ruler className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Size Charts Yet</h3>
              <p className="text-gray-500 mb-4">Create your first size chart template to get started</p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-[#576D64] hover:bg-[#465A52]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Grid3X3 className="w-5 h-5" />
              Edit: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-6 py-4">
              {/* Add Row/Column */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Add Size (Row)</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Input
                      value={newRowLabel}
                      onChange={(e) => setNewRowLabel(e.target.value)}
                      placeholder="e.g., S, M, L, XL"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleAddRow} 
                      disabled={!newRowLabel.trim() || isSubmitting}
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Add Measurement (Column)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2 w-full">
                      <Input
                        value={newColumnName}
                        onChange={(e) => {
                          setNewColumnName(e.target.value);
                          setNewColumnKey(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                        }}
                        placeholder="Display Name (e.g., Chest)"
                        className="w-200"
                      />
                      <Input
                        value={newColumnUnit}
                        onChange={(e) => setNewColumnUnit(e.target.value)}
                        placeholder="Unit"
                        className="w-20"
                      />
                      <Button 
                        onClick={handleAddColumn} 
                        disabled={!newColumnName.trim() || isSubmitting}
                        size="sm"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Size Chart Grid */}
              {(selectedTemplate.rows?.length || 0) > 0 && (selectedTemplate.columns?.length || 0) > 0 ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Size Chart Values
                      <Button 
                        onClick={handleSaveValues} 
                        disabled={isSubmitting}
                        size="sm"
                        className="bg-[#576D64] hover:bg-[#465A52]"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        Save Values
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Size</TableHead>
                          {selectedTemplate.columns?.map((col) => (
                            <TableHead key={col.id} className="min-w-24">
                              <div className="flex items-center justify-between">
                                <span>{col.display_name} ({col.unit})</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteColumn(col.id)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableHead>
                          ))}
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTemplate.rows?.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.size_label}</TableCell>
                            {selectedTemplate.columns?.map((col) => {
                              const key = `${row.size_label}_${col.column_key}`;
                              return (
                                <TableCell key={col.id}>
                                  <Input
                                    value={editValues[key] || ''}
                                    onChange={(e) => setEditValues(prev => ({
                                      ...prev,
                                      [key]: e.target.value
                                    }))}
                                    placeholder="--"
                                    className="w-full h-8 text-center"
                                  />
                                </TableCell>
                              );
                            })}
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteRow(row.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    <p>Add sizes (rows) and measurements (columns) to build your size chart</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

