import { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  Video, 
  File,
  Trash2, 
  Download, 
  Eye, 
  Edit3,
  Shield,
  Users,
  Calendar,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../lib/contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ContentItem {
  id: string;
  fileName: string;
  filePath: string;
  contentType: string;
  category: string;
  description: string;
  courseId: string;
  uploaderId: string;
  uploaderName: string;
  uploadedAt: string;
  signedUrl: string;
  bucketName: string;
  size?: number;
  downloadCount?: number;
}

interface Course {
  id: string;
  name: string;
  code: string;
  department: string;
  instructor: string;
}

export default function ContentManagement() {
  const { user } = useAuth();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCourse, setUploadCourse] = useState('');
  const [uploadCategory, setUploadCategory] = useState('materials');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user can upload content (admin/lecturer only)
  const canUploadContent = () => {
    if (!user || !user.profile) return false;
    const profile = user.profile as any;
    return ['admin', 'lecturer'].includes(profile.role);
  };

  // Initialize sample data
  useEffect(() => {
    if (user) {
      // Sample courses
      const sampleCourses: Course[] = [
        { id: 'cs101', name: 'Introduction to Computer Science', code: 'CS101', department: 'Computer Science', instructor: 'Dr. Smith' },
        { id: 'math201', name: 'Calculus II', code: 'MATH201', department: 'Mathematics', instructor: 'Prof. Johnson' },
        { id: 'phys101', name: 'Physics I', code: 'PHYS101', department: 'Physics', instructor: 'Dr. Brown' },
        { id: 'eng102', name: 'Technical Writing', code: 'ENG102', department: 'English', instructor: 'Prof. Davis' }
      ];
      setCourses(sampleCourses);

      // Sample content items
      const sampleContent: ContentItem[] = [
        {
          id: '1',
          fileName: 'CS101_Lecture1_Introduction.pdf',
          filePath: 'cs101/lectures/lecture1.pdf',
          contentType: 'application/pdf',
          category: 'materials',
          description: 'Introduction to Computer Science - Course overview and basic concepts',
          courseId: 'cs101',
          uploaderId: 'lecturer1',
          uploaderName: 'Dr. Smith',
          uploadedAt: new Date(Date.now() - 86400000).toISOString(),
          signedUrl: '#',
          bucketName: 'make-51e2cda7-materials',
          size: 2048000,
          downloadCount: 45
        },
        {
          id: '2',
          fileName: 'Math201_Assignment1.docx',
          filePath: 'math201/assignments/assignment1.docx',
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          category: 'assignments',
          description: 'Calculus II - Integration techniques assignment',
          courseId: 'math201',
          uploaderId: 'lecturer2',
          uploaderName: 'Prof. Johnson',
          uploadedAt: new Date(Date.now() - 172800000).toISOString(),
          signedUrl: '#',
          bucketName: 'make-51e2cda7-assignments',
          size: 1024000,
          downloadCount: 32
        },
        {
          id: '3',
          fileName: 'Physics_Lab_Demo.mp4',
          filePath: 'phys101/videos/lab_demo.mp4',
          contentType: 'video/mp4',
          category: 'videos',
          description: 'Physics I - Laboratory demonstration of pendulum motion',
          courseId: 'phys101',
          uploaderId: 'lecturer3',
          uploaderName: 'Dr. Brown',
          uploadedAt: new Date(Date.now() - 259200000).toISOString(),
          signedUrl: '#',
          bucketName: 'make-51e2cda7-videos',
          size: 15728640,
          downloadCount: 89
        }
      ];
      setContentItems(sampleContent);
    }
  }, [user]);

  // Filter content based on selected filters
  const filteredContent = contentItems.filter(item => {
    const matchesCourse = selectedCourse === 'all' || item.courseId === selectedCourse;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCourse && matchesCategory && matchesSearch;
  });

  // Get file icon based on content type
  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (contentType.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
    if (contentType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/avi',
      'video/mov'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not supported. Please upload PDF, DOC, TXT, images, or videos.');
      return;
    }

    setUploadFile(file);
  };

  // Upload content
  const uploadContent = async () => {
    if (!uploadFile || !uploadDescription.trim() || !uploadCourse || !user) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!canUploadContent()) {
      toast.error('Only administrators and lecturers can upload content');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Convert file to base64 for API upload
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        const base64Content = e.target?.result as string;
        const base64Data = base64Content.split(',')[1]; // Remove data:mime;base64, prefix

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-51e2cda7/content/upload`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                fileName: uploadFile.name,
                fileContent: base64Data,
                contentType: uploadFile.type,
                category: uploadCategory,
                description: uploadDescription.trim(),
                courseId: uploadCourse
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            toast.success('Content uploaded successfully!');
            
            // Add to local state for immediate feedback
            const newContentItem: ContentItem = {
              id: data.fileId,
              fileName: uploadFile.name,
              filePath: `${uploadCourse}/${Date.now()}_${uploadFile.name}`,
              contentType: uploadFile.type,
              category: uploadCategory,
              description: uploadDescription.trim(),
              courseId: uploadCourse,
              uploaderId: user.id,
              uploaderName: `${(user.profile as any).first_name} ${(user.profile as any).last_name}`,
              uploadedAt: new Date().toISOString(),
              signedUrl: data.signedUrl,
              bucketName: `make-51e2cda7-${uploadCategory}`,
              size: uploadFile.size,
              downloadCount: 0
            };
            
            setContentItems(prev => [newContentItem, ...prev]);
            
            // Reset form
            setUploadFile(null);
            setUploadDescription('');
            setUploadCourse('');
            setUploadCategory('materials');
            setShowUploadDialog(false);
            
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        } catch (error) {
          console.error('Error uploading content:', error);
          toast.error('Failed to upload content');
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      };

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      fileReader.readAsDataURL(uploadFile);
    } catch (error) {
      console.error('Error in upload process:', error);
      toast.error('Upload failed');
      setUploading(false);
    }
  };

  // Download content
  const downloadContent = (item: ContentItem) => {
    // In a real implementation, this would download from the signed URL
    toast.success(`Downloading ${item.fileName}...`);
    
    // Update download count
    setContentItems(prev => 
      prev.map(content => 
        content.id === item.id 
          ? { ...content, downloadCount: (content.downloadCount || 0) + 1 }
          : content
      )
    );
  };

  // Delete content
  const deleteContent = async (item: ContentItem) => {
    if (!canUploadContent()) {
      toast.error('Only administrators and lecturers can delete content');
      return;
    }

    if (item.uploaderId !== user?.id && (user?.profile as any)?.role !== 'admin') {
      toast.error('You can only delete your own content');
      return;
    }

    // Remove from local state
    setContentItems(prev => prev.filter(content => content.id !== item.id));
    toast.success('Content deleted successfully');
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Content Management
          </h2>
          <p className="text-muted-foreground">
            Manage course materials, assignments, and resources
          </p>
        </div>
        
        {canUploadContent() && (
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload New Content</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="file-upload">Select File</Label>
                  <input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full mt-2"
                  >
                    {uploadFile ? uploadFile.name : 'Choose File'}
                  </Button>
                  {uploadFile && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Size: {formatFileSize(uploadFile.size)}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="course-select">Course</Label>
                  <Select value={uploadCourse} onValueChange={setUploadCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category-select">Category</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="materials">Course Materials</SelectItem>
                      <SelectItem value="assignments">Assignments</SelectItem>
                      <SelectItem value="videos">Videos</SelectItem>
                      <SelectItem value="syllabus">Syllabus</SelectItem>
                      <SelectItem value="documents">Documents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the content..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="min-h-20"
                  />
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUploadDialog(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={uploadContent} 
                    disabled={!uploadFile || !uploadDescription.trim() || !uploadCourse || uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!canUploadContent() && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Read-Only Access</p>
                <p className="text-sm text-orange-600">
                  Only administrators and lecturers can upload and manage content. 
                  You can view and download available materials.
                </p>
                <Badge variant="outline" className="mt-2">
                  Current Role: {(user.profile as any)?.role || 'Student'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="course-filter">Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category-filter">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="assignments">Assignments</SelectItem>
                  <SelectItem value="videos">Videos</SelectItem>
                  <SelectItem value="syllabus">Syllabus</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedCourse('all');
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Content Library</span>
            <Badge variant="outline">
              {filteredContent.length} item{filteredContent.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map((item) => {
                  const course = courses.find(c => c.id === item.courseId);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(item.contentType)}
                          <div>
                            <div className="font-medium text-sm">{item.fileName}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{course?.code}</div>
                          <div className="text-muted-foreground">{course?.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{item.uploaderName}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(item.uploadedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.size ? formatFileSize(item.size) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.downloadCount || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadContent(item)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          {canUploadContent() && (item.uploaderId === user?.id || (user?.profile as any)?.role === 'admin') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteContent(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {filteredContent.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery || selectedCourse !== 'all' || selectedCategory !== 'all'
                    ? 'No content matches your filters'
                    : 'No content available'}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}