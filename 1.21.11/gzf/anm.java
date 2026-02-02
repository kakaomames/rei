import com.google.common.collect.Lists;
import com.google.common.collect.Sets;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import net.minecraft.server.MinecraftServer;
import org.jspecify.annotations.Nullable;

public class anm extends fur {
   private final MinecraftServer b;
   private final Set<fuj> c = Sets.newHashSet();
   private boolean d;

   public anm(MinecraftServer $$0) {
      this.b = $$0;
   }

   public void a(fus.a $$0) {
      $$0.a().forEach(($$1) -> {
         this.a((fuj.a)$$1);
      });
      $$0.b().forEach(($$1) -> {
         this.a((fur.a)$$1);
      });
      $$0.c().forEach(($$0x, $$1) -> {
         fuj $$2 = this.a((String)$$1);
         this.a($$0x, $$2);
      });
      $$0.d().forEach(($$1) -> {
         this.a((fum.a)$$1);
      });
   }

   private fus.a k() {
      return new fus.a(this.i(), this.g(), this.j(), this.h());
   }

   protected void a(fuq $$0, fuj $$1, fuo $$2) {
      super.a($$0, $$1, $$2);
      if (this.c.contains($$1)) {
         this.b.aj().a((aay)(new aha($$0.da(), $$1.c(), $$2.a(), Optional.ofNullable($$2.e()), Optional.ofNullable($$2.c()))));
      }

      this.a();
   }

   protected void a(fuq $$0, fuj $$1) {
      super.a($$0, $$1);
      this.a();
   }

   public void a(fuq $$0) {
      super.a($$0);
      this.b.aj().a((aay)(new afx($$0.da(), (String)null)));
      this.a();
   }

   public void b(fuq $$0, fuj $$1) {
      super.b($$0, $$1);
      if (this.c.contains($$1)) {
         this.b.aj().a((aay)(new afx($$0.da(), $$1.c())));
      }

      this.a();
   }

   public void a(fui $$0, @Nullable fuj $$1) {
      fuj $$2 = this.a((fui)$$0);
      super.a($$0, $$1);
      if ($$2 != $$1 && $$2 != null) {
         if (this.h($$2) > 0) {
            this.b.aj().a((aay)(new ago($$0, $$1)));
         } else {
            this.g($$2);
         }
      }

      if ($$1 != null) {
         if (this.c.contains($$1)) {
            this.b.aj().a((aay)(new ago($$0, $$1)));
         } else {
            this.e($$1);
         }
      }

      this.a();
   }

   public boolean a(String $$0, fum $$1) {
      if (super.a($$0, $$1)) {
         this.b.aj().a((aay)agz.a($$1, $$0, agz.a.a));
         this.f($$0);
         this.a();
         return true;
      } else {
         return false;
      }
   }

   public void b(String $$0, fum $$1) {
      super.b($$0, $$1);
      this.b.aj().a((aay)agz.a($$1, $$0, agz.a.b));
      this.f($$0);
      this.a();
   }

   public void a(fuj $$0) {
      super.a($$0);
      this.a();
   }

   public void b(fuj $$0) {
      super.b($$0);
      if (this.c.contains($$0)) {
         this.b.aj().a((aay)(new agw($$0, 2)));
      }

      this.a();
   }

   public void c(fuj $$0) {
      super.c($$0);
      if (this.c.contains($$0)) {
         this.g($$0);
      }

      this.a();
   }

   public void a(fum $$0) {
      super.a($$0);
      this.b.aj().a((aay)agz.a($$0, true));
      this.a();
   }

   public void b(fum $$0) {
      super.b($$0);
      this.b.aj().a((aay)agz.a($$0, false));
      this.e($$0);
      this.a();
   }

   public void c(fum $$0) {
      super.c($$0);
      this.b.aj().a((aay)agz.a($$0));
      this.e($$0);
      this.a();
   }

   protected void a() {
      this.d = true;
   }

   public void a(fus $$0) {
      if (this.d) {
         this.d = false;
         $$0.a(this.k());
      }

   }

   public List<aay<?>> d(fuj $$0) {
      List<aay<?>> $$1 = Lists.newArrayList();
      $$1.add(new agw($$0, 0));
      fui[] var3 = fui.values();
      int var4 = var3.length;

      for(int var5 = 0; var5 < var4; ++var5) {
         fui $$2 = var3[var5];
         if (this.a((fui)$$2) == $$0) {
            $$1.add(new ago($$2, $$0));
         }
      }

      Iterator var7 = this.i($$0).iterator();

      while(var7.hasNext()) {
         fuk $$3 = (fuk)var7.next();
         $$1.add(new aha($$3.c(), $$0.c(), $$3.d(), Optional.ofNullable($$3.e()), Optional.ofNullable($$3.f())));
      }

      return $$1;
   }

   public void e(fuj $$0) {
      List<aay<?>> $$1 = this.d($$0);
      Iterator var3 = this.b.aj().t().iterator();

      while(var3.hasNext()) {
         axg $$2 = (axg)var3.next();
         Iterator var5 = $$1.iterator();

         while(var5.hasNext()) {
            aay<?> $$3 = (aay)var5.next();
            $$2.g.b((aay)$$3);
         }
      }

      this.c.add($$0);
   }

   public List<aay<?>> f(fuj $$0) {
      List<aay<?>> $$1 = Lists.newArrayList();
      $$1.add(new agw($$0, 1));
      fui[] var3 = fui.values();
      int var4 = var3.length;

      for(int var5 = 0; var5 < var4; ++var5) {
         fui $$2 = var3[var5];
         if (this.a((fui)$$2) == $$0) {
            $$1.add(new ago($$2, $$0));
         }
      }

      return $$1;
   }

   public void g(fuj $$0) {
      List<aay<?>> $$1 = this.f($$0);
      Iterator var3 = this.b.aj().t().iterator();

      while(var3.hasNext()) {
         axg $$2 = (axg)var3.next();
         Iterator var5 = $$1.iterator();

         while(var5.hasNext()) {
            aay<?> $$3 = (aay)var5.next();
            $$2.g.b((aay)$$3);
         }
      }

      this.c.remove($$0);
   }

   public int h(fuj $$0) {
      int $$1 = 0;
      fui[] var3 = fui.values();
      int var4 = var3.length;

      for(int var5 = 0; var5 < var4; ++var5) {
         fui $$2 = var3[var5];
         if (this.a((fui)$$2) == $$0) {
            ++$$1;
         }
      }

      return $$1;
   }

   private void f(String $$0) {
      axg $$1 = this.b.aj().a($$0);
      if ($$1 != null) {
         $$1.A().j().d((fvx)$$1);
      }

   }

   private void e(fum $$0) {
      Iterator var2 = this.b.P().iterator();

      while(var2.hasNext()) {
         axf $$1 = (axf)var2.next();
         $$0.h().stream().map(($$0x) -> {
            return this.b.aj().a($$0x);
         }).filter(Objects::nonNull).forEach(($$1x) -> {
            $$1.j().d((fvx)$$1x);
         });
      }

   }
}
