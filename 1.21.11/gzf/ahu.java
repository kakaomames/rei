import com.google.common.collect.Lists;
import io.netty.buffer.ByteBuf;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;

public class ahu implements aay<adb> {
   public static final aao<xq, ahu> a;
   private final int b;
   private final List<ahu.a> c;

   public ahu(int $$0, Collection<cio> $$1) {
      this.b = $$0;
      this.c = Lists.newArrayList();
      Iterator var3 = $$1.iterator();

      while(var3.hasNext()) {
         cio $$2 = (cio)var3.next();
         this.c.add(new ahu.a($$2.a(), $$2.b(), $$2.c()));
      }

   }

   private ahu(int $$0, List<ahu.a> $$1) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<ahu> a() {
      return ahz.bl;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.b;
   }

   public List<ahu.a> e() {
      return this.c;
   }

   static {
      a = aao.a(aam.h, ahu::b, ahu.a.b.a(aam.a()), ahu::e, ahu::new);
   }

   public static record a(jd<cin> c, double d, Collection<ciq> e) {
      public static final aao<ByteBuf, ciq> a;
      public static final aao<xq, ahu.a> b;

      public a(jd<cin> param1, double param2, Collection<ciq> param4) {
         this.c = $$0;
         this.d = $$1;
         this.e = $$2;
      }

      public jd<cin> a() {
         return this.c;
      }

      public double b() {
         return this.d;
      }

      public Collection<ciq> c() {
         return this.e;
      }

      static {
         a = aao.a(amo.b, ciq::a, aam.m, ciq::b, ciq.a.e, ciq::c, ciq::new);
         b = aao.a(cin.b, ahu.a::a, aam.m, ahu.a::b, a.a(aam.a(ArrayList::new)), ahu.a::c, ahu.a::new);
      }
   }
}
