import com.google.common.collect.Lists;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;

public class amf<R extends dqs<?>> {
   private static final int a = -1;
   private final ddl b;
   private final amf.a<R> c;
   private final boolean d;
   private final int e;
   private final int f;
   private final List<dji> g;
   private final List<dji> h;

   public static <I extends dqy, R extends dqs<I>> diz.a a(amf.a<R> $$0, int $$1, int $$2, List<dji> $$3, List<dji> $$4, ddl $$5, dqx<R> $$6, boolean $$7, boolean $$8) {
      amf<R> $$9 = new amf($$0, $$5, $$7, $$1, $$2, $$3, $$4);
      if (!$$8 && !$$9.b()) {
         return diz.a.a;
      } else {
         ddu $$10 = new ddu();
         $$5.a($$10);
         $$0.a($$10);
         return $$9.a($$6, $$10);
      }
   }

   private amf(amf.a<R> $$0, ddl $$1, boolean $$2, int $$3, int $$4, List<dji> $$5, List<dji> $$6) {
      this.c = $$0;
      this.b = $$1;
      this.d = $$2;
      this.e = $$3;
      this.f = $$4;
      this.g = $$5;
      this.h = $$6;
   }

   private diz.a a(dqx<R> $$0, ddu $$1) {
      if ($$1.a((dqs)$$0.b(), (ddt.b)null)) {
         this.b($$0, $$1);
         this.b.e();
         return diz.a.a;
      } else {
         this.a();
         this.b.e();
         return diz.a.b;
      }
   }

   private void a() {
      Iterator var1 = this.h.iterator();

      while(var1.hasNext()) {
         dji $$0 = (dji)var1.next();
         dlt $$1 = $$0.g().v();
         this.b.a($$1, false);
         $$0.f($$1);
      }

      this.c.a();
   }

   private void b(dqx<R> $$0, ddu $$1) {
      boolean $$2 = this.c.a($$0);
      int $$3 = $$1.b($$0.b(), (ddt.b)null);
      if ($$2) {
         Iterator var5 = this.g.iterator();

         while(var5.hasNext()) {
            dji $$4 = (dji)var5.next();
            dlt $$5 = $$4.g();
            if (!$$5.f() && Math.min($$3, $$5.k()) < $$5.N() + 1) {
               return;
            }
         }
      }

      int $$6 = this.a($$3, $$2);
      List<jd<dlp>> $$7 = new ArrayList();
      dqs var10001 = $$0.b();
      Objects.requireNonNull($$7);
      if ($$1.a(var10001, $$6, $$7::add)) {
         int $$8 = a($$6, $$7);
         if ($$8 != $$6) {
            $$7.clear();
            var10001 = $$0.b();
            Objects.requireNonNull($$7);
            if (!$$1.a(var10001, $$8, $$7::add)) {
               return;
            }
         }

         this.a();
         ame.a(this.e, this.f, $$0.b(), $$0.b().aq_().a(), ($$2x, $$3x, $$4x, $$5x) -> {
            if ($$2x != -1) {
               dji $$6 = (dji)this.g.get($$3x);
               jd<dlp> $$7x = (jd)$$7.get($$2x);
               int $$8x = $$8;

               do {
                  if ($$8x <= 0) {
                     return;
                  }

                  $$8x = this.a($$6, $$7x, $$8x);
               } while($$8x != -1);

            }
         });
      }
   }

   private static int a(int $$0, List<jd<dlp>> $$1) {
      jd $$2;
      for(Iterator var2 = $$1.iterator(); var2.hasNext(); $$0 = Math.min($$0, ((dlp)$$2.a()).g())) {
         $$2 = (jd)var2.next();
      }

      return $$0;
   }

   private int a(int $$0, boolean $$1) {
      if (this.d) {
         return $$0;
      } else if ($$1) {
         int $$2 = Integer.MAX_VALUE;
         Iterator var4 = this.g.iterator();

         while(var4.hasNext()) {
            dji $$3 = (dji)var4.next();
            dlt $$4 = $$3.g();
            if (!$$4.f() && $$2 > $$4.N()) {
               $$2 = $$4.N();
            }
         }

         if ($$2 != Integer.MAX_VALUE) {
            ++$$2;
         }

         return $$2;
      } else {
         return 1;
      }
   }

   private int a(dji $$0, jd<dlp> $$1, int $$2) {
      dlt $$3 = $$0.g();
      int $$4 = this.b.a($$1, $$3);
      if ($$4 == -1) {
         return -1;
      } else {
         dlt $$5 = this.b.a($$4);
         dlt $$7;
         if ($$2 < $$5.N()) {
            $$7 = this.b.a($$4, $$2);
         } else {
            $$7 = this.b.b($$4);
         }

         int $$8 = $$7.N();
         if ($$3.f()) {
            $$0.f($$7);
         } else {
            $$3.g($$8);
         }

         return $$2 - $$8;
      }
   }

   private boolean b() {
      List<dlt> $$0 = Lists.newArrayList();
      int $$1 = this.c();
      Iterator var3 = this.g.iterator();

      while(true) {
         while(true) {
            dlt $$3;
            do {
               if (!var3.hasNext()) {
                  return true;
               }

               dji $$2 = (dji)var3.next();
               $$3 = $$2.g().v();
            } while($$3.f());

            int $$4 = this.b.f($$3);
            if ($$4 == -1 && $$0.size() <= $$1) {
               Iterator var7 = $$0.iterator();

               while(var7.hasNext()) {
                  dlt $$5 = (dlt)var7.next();
                  if (dlt.b($$5, $$3) && $$5.N() != $$5.k() && $$5.N() + $$3.N() <= $$5.k()) {
                     $$5.g($$3.N());
                     $$3.e(0);
                     break;
                  }
               }

               if (!$$3.f()) {
                  if ($$0.size() >= $$1) {
                     return false;
                  }

                  $$0.add($$3);
               }
            } else if ($$4 == -1) {
               return false;
            }
         }
      }
   }

   private int c() {
      int $$0 = 0;
      Iterator var2 = this.b.j().iterator();

      while(var2.hasNext()) {
         dlt $$1 = (dlt)var2.next();
         if ($$1.f()) {
            ++$$0;
         }
      }

      return $$0;
   }

   public interface a<T extends dqs<?>> {
      void a(ddu var1);

      void a();

      boolean a(dqx<T> var1);
   }
}
