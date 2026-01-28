'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { Input } from '@/components/ui/input';
import {
  BookOpen,
  GraduationCap,
  Trophy,
  Clock,
  Play,
  CheckCircle2,
  Search,
  Filter,
  Star,
  Video,
  FileText,
  ArrowRight,
} from 'lucide-react';
import Image from "next/image";
import Link from 'next/link';
import {
  coursesApi,
  enrollmentsApi,
  certificatesApi,
  Course,
  Enrollment,
  Certificate,
  EnrollmentStatistics,
} from '@/lib/api/learning';
import { useAuthStore } from '@/stores/auth-store';

export default function LearningDashboard() {
  const { user } = useAuthStore();
  const [publishedCourses, setPublishedCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [myCertificates, setMyCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<EnrollmentStatistics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const [coursesRes, enrollmentsRes, certificatesRes, statisticsRes] = await Promise.all([
          coursesApi.listPublished(),
          enrollmentsApi.getActiveByEmployee(user.id),
          certificatesApi.getByEmployee(user.id),
          enrollmentsApi.getStatistics(user.id),
        ]);

        setPublishedCourses(coursesRes.data || []);
        setMyEnrollments(enrollmentsRes.data || []);
        setMyCertificates(certificatesRes.data || []);
        setStats(statisticsRes.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadData();
    }
  }, [user?.id]);



  const filteredCourses = publishedCourses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Treinamentos</h1>
          <p className="text-muted-foreground">
            Aprenda, desenvolva-se e conquiste certificados
          </p>
        </div>
        <Link href="/learning/catalog">
          <Button>
            <BookOpen className="h-4 w-4 mr-2" />
            Catalogo de Cursos
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Cursos em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inProgress || 0}</div>
            <Progress value={stats?.averageProgress || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.averageProgress?.toFixed(0) || 0}% progresso medio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Cursos Concluidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {stats?.total || 0} matriculas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Certificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{myCertificates.length}</div>
            <p className="text-xs text-muted-foreground">
              conquistados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horas de Estudo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Continuar Aprendendo */}
      {myEnrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Continuar Aprendendo
            </CardTitle>
            <CardDescription>Retome de onde parou</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myEnrollments.slice(0, 3).map((enrollment) => (
                <Link key={enrollment.id} href={`/learning/course/${enrollment.courseId}`}>
                  <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-primary/50" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-1">{enrollment.courseName}</h3>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{enrollment.progressPercentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={enrollment.progressPercentage} />
                      </div>
                      <Button size="sm" className="w-full mt-3">
                        <Play className="h-3 w-3 mr-2" />
                        Continuar
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {myEnrollments.length > 3 && (
              <Link href="/learning/my-courses">
                <Button variant="ghost" className="w-full mt-4">
                  Ver todos os {myEnrollments.length} cursos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Catalogo de Cursos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Explorar Cursos</CardTitle>
              <CardDescription>Descubra novos treinamentos</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cursos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum curso encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.slice(0, 6).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
          <Link href="/learning/catalog">
            <Button variant="ghost" className="w-full mt-4">
              Ver catalogo completo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Certificados */}
      {myCertificates.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Meus Certificados
                </CardTitle>
                <CardDescription>Suas conquistas e certificacoes</CardDescription>
              </div>
              <Link href="/learning/certificates">
                <Button variant="outline" size="sm">Ver Todos</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myCertificates.slice(0, 3).map((certificate) => (
                <div
                  key={certificate.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium line-clamp-1">{certificate.courseName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(certificate.issuedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Baixar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/learning/paths">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5" />
                Trilhas de Aprendizagem
              </CardTitle>
              <CardDescription>
                Siga caminhos estruturados de desenvolvimento
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/learning/mandatory">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5" />
                Treinamentos Obrigatorios
              </CardTitle>
              <CardDescription>
                Cursos requeridos para sua funcao
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/learning/history">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Historico
              </CardTitle>
              <CardDescription>
                Todos os seus treinamentos realizados
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}

// Componente de Card de Curso
function CourseCard({ course }: { course: Course }) {
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const getDifficultyColor = (level?: string) => {
    const colors: Record<string, string> = {
      INICIANTE: 'bg-green-100 text-green-800',
      INTERMEDIARIO: 'bg-yellow-100 text-yellow-800',
      AVANCADO: 'bg-red-100 text-red-800',
    };
    return colors[level || ''] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Link href={`/learning/course/${course.id}`}>
      <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
        <div className="h-36 bg-gradient-to-br from-primary/20 to-primary/5 relative">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary/50" />
            </div>
          )}
          {course.isMandatory && (
            <Badge className="absolute top-2 right-2" variant="destructive">
              Obrigatorio
            </Badge>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold line-clamp-2">{course.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">
            {course.description}
          </p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {course.difficultyLevel && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(course.difficultyLevel)}`}>
                {course.difficultyLevel === 'INICIANTE' ? 'Iniciante' :
                  course.difficultyLevel === 'INTERMEDIARIO' ? 'Intermediario' : 'Avancado'}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(course.durationMinutes)}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Video className="h-3 w-3" />
              {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} aulas
            </span>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <div className="flex items-center gap-1">
              {course.instructorName && (
                <span className="text-xs text-muted-foreground">
                  Por {course.instructorName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium">4.8</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
