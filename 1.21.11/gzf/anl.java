import com.mojang.datafixers.util.Either;
import io.netty.buffer.ByteBuf;
import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.function.IntFunction;

public record anl(List<anl.a> d) {
   public static final anl a = new anl(List.of());
   public static final aao<ByteBuf, Either<anl.b, yh>> b;
   public static final aao<ByteBuf, List<anl.c>> c;

   public anl(List<anl.a> param1) {
      this.d = $$0;
   }

   public boolean a() {
      return this.d.isEmpty();
   }

   public Optional<anl.a> a(anl.b $$0) {
      return this.d.stream().filter(($$1) -> {
         return (Boolean)$$1.a.map(($$1x) -> {
            return $$1x == $$0;
         }, ($$0x) -> {
            return false;
         });
      }).findFirst();
   }

   public List<anl.c> b() {
      return this.d.stream().map(($$0) -> {
         return new anl.c($$0.a, $$0.b.toString());
      }).toList();
   }

   public List<anl.a> c() {
      return this.d;
   }

   static {
      b = aam.a(anl.b.k, yj.f);
      c = anl.c.a.a(aam.a());
   }

   public static enum b {
      a(0, "report_bug"),
      b(1, "community_guidelines"),
      c(2, "support"),
      d(3, "status"),
      e(4, "feedback"),
      f(5, "community"),
      g(6, "website"),
      h(7, "forums"),
      i(8, "news"),
      j(9, "announcements");

      private static final IntFunction<anl.b> l = beu.a(($$0) -> {
         return $$0.m;
      }, values(), (beu.a)beu.a.a);
      public static final aao<ByteBuf, anl.b> k = aam.a(l, ($$0) -> {
         return $$0.m;
      });
      private final int m;
      private final String n;

      private b(final int param3, final String param4) {
         this.m = $$0;
         this.n = $$1;
      }

      private yh a() {
         return yh.c("known_server_link." + this.n);
      }

      public anl.a a(URI $$0) {
         return anl.a.a(this, $$0);
      }

      // $FF: synthetic method
      private static anl.b[] b() {
         return new anl.b[]{a, b, c, d, e, f, g, h, i, j};
      }
   }

   public static record c(Either<anl.b, yh> b, String c) {
      public static final aao<ByteBuf, anl.c> a;

      public c(Either<anl.b, yh> param1, String param2) {
         this.b = $$0;
         this.c = $$1;
      }

      public Either<anl.b, yh> a() {
         return this.b;
      }

      public String b() {
         return this.c;
      }

      static {
         a = aao.a(anl.b, anl.c::a, aam.p, anl.c::b, anl.c::new);
      }
   }

   public static record a(Either<anl.b, yh> a, URI b) {
      final Either<anl.b, yh> a;
      final URI b;

      public a(Either<anl.b, yh> param1, URI param2) {
         this.a = $$0;
         this.b = $$1;
      }

      public static anl.a a(anl.b $$0, URI $$1) {
         return new anl.a(Either.left($$0), $$1);
      }

      public static anl.a a(yh $$0, URI $$1) {
         return new anl.a(Either.right($$0), $$1);
      }

      public yh a() {
         return (yh)this.a.map(anl.b::a, ($$0) -> {
            return $$0;
         });
      }

      public Either<anl.b, yh> b() {
         return this.a;
      }

      public URI c() {
         return this.b;
      }
   }
}
