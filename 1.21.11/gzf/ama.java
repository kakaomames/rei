import com.mojang.logging.LogUtils;
import io.netty.handler.codec.DecoderException;
import io.netty.handler.codec.EncoderException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.apache.commons.lang3.ObjectUtils;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;

public class ama {
   private static final Logger a = LogUtils.getLogger();
   private static final int b = 254;
   static final bew c = new bew();
   private final alz d;
   private final ama.b<?>[] e;
   private boolean f;

   ama(alz $$0, ama.b<?>[] $$1) {
      this.d = $$0;
      this.e = $$1;
   }

   public static <T> alw<T> a(Class<? extends alz> $$0, alx<T> $$1) {
      if (a.isDebugEnabled()) {
         try {
            Class<?> $$2 = Class.forName(Thread.currentThread().getStackTrace()[2].getClassName());
            if (!$$2.equals($$0)) {
               a.debug("defineId called for: {} from {}", new Object[]{$$0, $$2, new RuntimeException()});
            }
         } catch (ClassNotFoundException var3) {
         }
      }

      int $$3 = c.c($$0);
      if ($$3 > 254) {
         throw new IllegalArgumentException("Data value id is too big with " + $$3 + "! (Max is 254)");
      } else {
         return $$1.a($$3);
      }
   }

   private <T> ama.b<T> b(alw<T> $$0) {
      return this.e[$$0.a()];
   }

   public <T> T a(alw<T> $$0) {
      return this.b($$0).b();
   }

   public <T> void a(alw<T> $$0, T $$1) {
      this.a($$0, $$1, false);
   }

   public <T> void a(alw<T> $$0, T $$1, boolean $$2) {
      ama.b<T> $$3 = this.b($$0);
      if ($$2 || ObjectUtils.notEqual($$1, $$3.b())) {
         $$3.a($$1);
         this.d.a($$0);
         $$3.a(true);
         this.f = true;
      }

   }

   public boolean a() {
      return this.f;
   }

   @Nullable
   public List<ama.c<?>> b() {
      if (!this.f) {
         return null;
      } else {
         this.f = false;
         List<ama.c<?>> $$0 = new ArrayList();
         ama.b[] var2 = this.e;
         int var3 = var2.length;

         for(int var4 = 0; var4 < var3; ++var4) {
            ama.b<?> $$1 = var2[var4];
            if ($$1.c()) {
               $$1.a(false);
               $$0.add($$1.e());
            }
         }

         return $$0;
      }
   }

   @Nullable
   public List<ama.c<?>> c() {
      List<ama.c<?>> $$0 = null;
      ama.b[] var2 = this.e;
      int var3 = var2.length;

      for(int var4 = 0; var4 < var3; ++var4) {
         ama.b<?> $$1 = var2[var4];
         if (!$$1.d()) {
            if ($$0 == null) {
               $$0 = new ArrayList();
            }

            $$0.add($$1.e());
         }
      }

      return $$0;
   }

   public void a(List<ama.c<?>> $$0) {
      Iterator var2 = $$0.iterator();

      while(var2.hasNext()) {
         ama.c<?> $$1 = (ama.c)var2.next();
         ama.b<?> $$2 = this.e[$$1.a];
         this.a($$2, $$1);
         this.d.a($$2.a());
      }

      this.d.a($$0);
   }

   private <T> void a(ama.b<T> $$0, ama.c<?> $$1) {
      if (!Objects.equals($$1.b(), $$0.a.b())) {
         throw new IllegalStateException(String.format(Locale.ROOT, "Invalid entity data item type for field %d on entity %s: old=%s(%s), new=%s(%s)", $$0.a.a(), this.d, $$0.b, $$0.b.getClass(), $$1.c, $$1.c.getClass()));
      } else {
         $$0.a($$1.c);
      }
   }

   public static class b<T> {
      final alw<T> a;
      T b;
      private final T c;
      private boolean d;

      public b(alw<T> $$0, T $$1) {
         this.a = $$0;
         this.c = $$1;
         this.b = $$1;
      }

      public alw<T> a() {
         return this.a;
      }

      public void a(T $$0) {
         this.b = $$0;
      }

      public T b() {
         return this.b;
      }

      public boolean c() {
         return this.d;
      }

      public void a(boolean $$0) {
         this.d = $$0;
      }

      public boolean d() {
         return this.c.equals(this.b);
      }

      public ama.c<T> e() {
         return ama.c.a(this.a, this.b);
      }
   }

   public static record c<T>(int a, alx<T> b, T c) {
      final int a;
      final T c;

      public c(int param1, alx<T> param2, T param3) {
         this.a = $$0;
         this.b = $$1;
         this.c = $$2;
      }

      public static <T> ama.c<T> a(alw<T> $$0, T $$1) {
         alx<T> $$2 = $$0.b();
         return new ama.c($$0.a(), $$2, $$2.copy($$1));
      }

      public void a(xq $$0) {
         int $$1 = aly.b(this.b);
         if ($$1 < 0) {
            throw new EncoderException("Unknown serializer type " + String.valueOf(this.b));
         } else {
            $$0.l(this.a);
            $$0.c($$1);
            this.b.codec().encode($$0, this.c);
         }
      }

      public static ama.c<?> a(xq $$0, int $$1) {
         int $$2 = $$0.l();
         alx<?> $$3 = aly.a($$2);
         if ($$3 == null) {
            throw new DecoderException("Unknown serializer type " + $$2);
         } else {
            return a($$0, $$1, $$3);
         }
      }

      private static <T> ama.c<T> a(xq $$0, int $$1, alx<T> $$2) {
         return new ama.c($$1, $$2, $$2.codec().decode($$0));
      }

      public int a() {
         return this.a;
      }

      public alx<T> b() {
         return this.b;
      }

      public T c() {
         return this.c;
      }
   }

   public static class a {
      private final alz a;
      private final ama.b<?>[] b;

      public a(alz $$0) {
         this.a = $$0;
         this.b = new ama.b[ama.c.b($$0.getClass())];
      }

      public <T> ama.a a(alw<T> $$0, T $$1) {
         int $$2 = $$0.a();
         if ($$2 > this.b.length) {
            throw new IllegalArgumentException("Data value id is too big with " + $$2 + "! (Max is " + this.b.length + ")");
         } else if (this.b[$$2] != null) {
            throw new IllegalArgumentException("Duplicate id value for " + $$2 + "!");
         } else if (aly.b($$0.b()) < 0) {
            String var10002 = String.valueOf($$0.b());
            throw new IllegalArgumentException("Unregistered serializer " + var10002 + " for " + $$2 + "!");
         } else {
            this.b[$$0.a()] = new ama.b($$0, $$1);
            return this;
         }
      }

      public ama a() {
         for(int $$0 = 0; $$0 < this.b.length; ++$$0) {
            if (this.b[$$0] == null) {
               String var10002 = String.valueOf(this.a.getClass());
               throw new IllegalStateException("Entity " + var10002 + " has not defined synched data value " + $$0);
            }
         }

         return new ama(this.a, this.b);
      }
   }
}
